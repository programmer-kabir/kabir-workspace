import React, { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { useApp } from '../context/AppContext';

export const FaqAccordion = () => {
  const { paymentChannels } = useApp();
  const supportNumber = paymentChannels?.bkash?.number || '01738679399';
  const cleanWaNumber = supportNumber.replace(/\D/g, '').replace(/^0/, '880');

  const [openIndex, setOpenIndex] = useState(0); // First FAQ open by default

  const faqs = [
    {
      q: 'টাকা পাঠানোর কতক্ষণ পর অ্যাকাউন্টে ডায়মন্ড আসবে?',
      a: 'বিকাশ, নগদ বা রকেটে টাকা পাঠিয়ে সঠিক TrxID দেওয়ার পর সাধারণত ১ থেকে ৩ মিনিটের মধ্যেই স্বয়ংক্রিয়ভাবে আপনার গেম অ্যাকাউন্টে ডায়মন্ড যুক্ত হয়ে যায়। রাত-দিন ২৪ ঘণ্টাই এই সার্ভিস চালু থাকে।'
    },
    {
      q: 'টপ-আপের জন্য কি পাসওয়ার্ড বা জিমেইল দিতে হবে?',
      a: 'না, কখনোই নয়! আপনার গেম আইডির পাসওয়ার্ড বা ফেসবুক/জিমেইল দেওয়ার কোনো প্রয়োজন নেই। শুধু আপনার ৮-১০ ডিজিটের প্লেয়ার আইডি (Player UID) দিয়েই সম্পূর্ণ নিরাপদে ডায়মন্ড টপ-আপ হয়।'
    },
    {
      q: 'ভুল প্লেয়ার আইডি (UID) দিলে কী হবে?',
      a: 'ভুল এড়াতে আমাদের সাইটে স্বয়ংক্রিয় "নাম চেক" সিস্টেম রয়েছে। UID লেখার পর নাম চেক বাটনে ক্লিক করলে আপনার গেমের সঠিক নিকনেম শো করবে, ফলে ভুল আইডিতে ডায়মন্ড যাওয়ার কোনো ঝুঁকি নেই।'
    },
    {
      q: 'টাকা পাঠিয়েছি কিন্তু TrxID দিতে ভুলে গেছি বা পেজ বন্ধ হয়ে গেছে?',
      a: 'কোনো চিন্তা করবেন না! বিকাশ বা নগদের মেসেজ থেকে TrxID কপি করে সাইটের শীর্ষে থাকা "ট্র্যাক অর্ডার" অপশনে দিন অথবা নিচে থাকা আমাদের WhatsApp হেল্পলাইনে মেসেজ দিন। অ্যাডমিন তাৎক্ষণিক ভেরিফাই করে ডেলিভারি দিয়ে দেবে।'
    },
    {
      q: 'উইকলি বা মান্থলি মেম্বারশিপ নিলে কীভাবে ডায়মন্ড পাবো?',
      a: 'মেম্বারশিপ প্যাকেজ কেনার সাথে সাথে প্রথম দিনের ইনস্ট্যান্ট ডায়মন্ড আপনার অ্যাকাউন্টে ঢুকে যাবে এবং পরবর্তী দিনগুলোর ডায়মন্ড আপনি গেমে ঢুকে ডেইলি ক্লেইম করে নিতে পারবেন।'
    }
  ];

  const toggleFaq = (index) => {
    sounds.playClick();
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-5 sm:p-7 my-6 sm:my-8 shadow-xs">
      {/* Section Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/25 px-3 py-1 rounded-full text-xs text-sky-600 dark:text-sky-400 font-bold mb-2">
          <HelpCircle size={14} /> সাধারণ জিজ্ঞাসা ও সমাধান
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
          ❓ সাধারণ প্রশ্নোত্তর (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          টপ-আপ নিয়ে গেমারদের সচরাচর সব প্রশ্নের উত্তর এক নজরে দেখে নিন:
        </p>
      </div>

      {/* Accordion List */}
      <div className="flex flex-col gap-2.5 max-w-2xl mx-auto">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`border rounded-xl overflow-hidden transition-all duration-200 shadow-xs ${
                isOpen 
                  ? 'bg-sky-500/5 border-sky-500/50 dark:border-sky-500/40' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <span className={`text-xs sm:text-sm font-bold leading-snug ${isOpen ? 'text-sky-500' : 'text-slate-900 dark:text-white'}`}>
                  {faq.q}
                </span>
                <span className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-sky-500' : 'text-slate-400'}`}>
                  <ChevronDown size={18} />
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need More Help WhatsApp Banner */}
      <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between flex-wrap gap-2.5 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-emerald-500 shrink-0" />
          <span className="text-xs text-slate-700 dark:text-slate-300">
            অন্য কোনো সমস্যা বা প্রশ্ন থাকলে আমাদের সাথে সরাসরি যোগাযোগ করুন:
          </span>
        </div>
        <a
          href={`https://wa.me/${cleanWaNumber}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          onClick={() => sounds.playClick()}
        >
          <span>WhatsApp সাপোর্ট</span>
        </a>
      </div>
    </div>
  );
};
