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
      a: 'কোনো চিন্তা করবেন না! বিকাশ বা নগদের মেসেজ থেকে TrxID কপি করে সাইটের শীর্ষে থাকা "অর্ডার ট্র্যাক" অপশনে দিন অথবা নিচে থাকা আমাদের WhatsApp হেল্পলাইনে মেসেজ দিন। অ্যাডমিন তাৎক্ষণিক ভেরিফাই করে ডেলিভারি দিয়ে দেবে।'
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
    <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 my-8 sm:my-12 shadow-sm">
      
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 px-3.5 py-1.5 rounded-full text-xs text-sky-700 font-bold mb-3 shadow-xs">
          <HelpCircle size={15} /> 
          <span>সাধারণ জিজ্ঞাসা ও সমাধান</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          ❓ সাধারণ প্রশ্নোত্তর (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium">
          টপ-আপ নিয়ে গেমারদের সচরাচর সব প্রশ্নের উত্তর এক নজরে দেখে নিন:
        </p>
      </div>

      {/* Accordion List with Generous Spacing */}
      <div className="flex flex-col gap-3.5 max-w-2xl mx-auto">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                isOpen 
                  ? 'bg-sky-50/40 border-sky-300 shadow-sm' 
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <span className={`text-xs sm:text-sm font-bold leading-snug ${isOpen ? 'text-sky-700' : 'text-slate-900'}`}>
                  {faq.q}
                </span>
                <span className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-sky-600' : 'text-slate-400'}`}>
                  <ChevronDown size={18} />
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need More Help WhatsApp Banner */}
      <div className="mt-7 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-3 max-w-2xl mx-auto shadow-xs">
        <div className="flex items-center gap-2.5">
          <MessageCircle size={20} className="text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm text-slate-700 font-medium">
            অন্য কোনো সমস্যা বা প্রশ্ন থাকলে সরাসরি কথা বলুন:
          </span>
        </div>
        <a
          href={`https://wa.me/${cleanWaNumber}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          onClick={() => sounds.playClick()}
        >
          <span>WhatsApp সাপোর্ট</span>
        </a>
      </div>

    </section>
  );
};
