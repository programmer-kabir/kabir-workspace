import React, { useState } from "react";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const FAQS = [
  {
    q: "কিস্তিতে পণ্য নেওয়ার জন্য ঠিক কী কী কাগজপত্র জমা দিতে হবে?",
    a: "খুব সাধারণ কিছু ডকুমেন্টস লাগে: আপনার জাতীয় পরিচয়পত্র (NID)-এর স্পষ্ট ছবি, ১ কপি পাসপোর্ট সাইজ ছবি, একজন পরিচিত ব্যক্তির (গ্যারান্টর) NID কার্ডের ছবি এবং সক্রিয় মোবাইল নম্বর ও বর্তমান ঠিকানা। কোনো ব্যাংক চেক বা ক্রেডিট কার্ড আবশ্যক নয়।",
  },
  {
    q: "ডাউনপেমেন্ট কত শতাংশ দিতে হয় এবং কিস্তির মেয়াদ ও ফি কেমন?",
    a: "ন্যূনতম ডাউনপেমেন্ট মাত্র ৩০%। কিস্তির মেয়াদ সুনির্দিষ্ট দুটি প্ল্যানে নির্ধারিত: ৬ মাসের জন্য মাত্র ১০% ফি এবং ১২ মাসের জন্য মাত্র ১৫% ফি। কোনো প্রকার গোপন বা অতিরিক্ত প্রসেসিং চার্জ নেই (হিডেন ফি ৳০)।",
  },
  {
    q: "মেয়াদ শেষ হওয়ার আগেই সমস্ত টাকা পরিশোধ করলে কোনো ছাড় বা রিবেট পাব?",
    a: "হ্যাঁ, ১০০%! SupplyLink-এ কোনো গ্রাহক যদি তার নির্ধারিত ৬ বা ১২ মাস শেষ হওয়ার পূর্বেই সম্পূর্ণ বকেয়া কিস্তির টাকা এককালীন পরিশোধ করেন, তবে মার্কআপ ফির ওপর বিশেষ ক্যাশব্যাক বা রিবেট ছাড় প্রদান করা হয়।",
  },
  {
    q: "প্রতি মাসের কিস্তি কীভাবে ঘরে বসে পরিশোধ করব?",
    a: "আপনি অত্যন্ত সহজে বিকাশ (bKash), নগদ (Nagad), রকেট অথবা ব্যাংক ট্রান্সফারের মাধ্যমে ঘরে বসেই প্রতি মাসের কিস্তি পরিশোধ করতে পারেন। অথবা সরাসরি আমাদের সুনামগঞ্জ সদর হেড অফিসে এসেও জমা দেওয়া যায়।",
  },
  {
    q: "বিনিয়োগকারীদের মূলধনের নিরাপত্তা ও লভ্যাংশের নিয়ম কী?",
    a: "প্রতিটি বিনিয়োগের জন্য ৩০০ টাকার সরকারি নন-জুডিশিয়াল স্ট্যাম্পে দ্বিপাক্ষিক আইনি চুক্তিপত্র, সিকিউরিটি চেক ও মানি রসিদ প্রদান করা হয়। সম্পূর্ণ হালাল ও দৃশ্যমান পণ্যের কিস্তি বাণিজ্যের ওপর গড়ে ৮%–১২% হারে মাসিক লভ্যাংশ সরাসরি আপনার একাউন্টে পৌঁছে দেওয়া হয়।",
  },
  {
    q: "আবেদন করার পর কত দ্রুত পণ্য ডেলিভারি পাওয়া যায়?",
    a: "WhatsApp-এ তথ্য দেওয়ার পর মাত্র ৩ মিনিটের মধ্যে প্রাথমিক অনলাইন যাচাই শেষ হয়। আবেদন অনুমোদন ও ৩০% ডাউনপেমেন্ট নিশ্চিত হওয়ার পর ২৪ ঘণ্টার মধ্যে অফিসিয়াল মেমো ও ওয়ারেন্টি সহ পণ্য আপনার হাতে তুলে দেওয়া হয়।",
  },
  {
    q: "আমি কি সুনামগঞ্জ সদর বা আশপাশের উপজেলা থেকে আবেদন করতে পারব?",
    a: "হ্যাঁ! সুনামগঞ্জ সদর, মঙ্গলকাটা, জাহাঙ্গীরনগর, ইসলামপুর, সুরমা সহ সমগ্র সুনামগঞ্জ ও সিলেট বিভাগের যেকোনো এলাকা থেকেই সরাসরি আবেদন করা যায়।",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/60 relative">
      <div className=" mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            সাধারণ জিজ্ঞাসা
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            সচরাচর জিজ্ঞাসিত প্রশ্ন ও উত্তর
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            কিস্তি বা বিনিয়োগ সংক্রান্ত যেকোনো সংশয় দূর করতে নিচের উত্তরগুলো পড়ুন।
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "border-indigo-500/50 bg-white shadow-md ring-1 ring-indigo-500/10"
                    : "border-slate-200/90 bg-white hover:border-slate-300 shadow-xs"
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-5 sm:p-6 text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base pr-4 flex items-center gap-2.5">
                    <FiHelpCircle className="text-indigo-600 h-4 w-4 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-indigo-50 text-indigo-600" : ""
                    }`}
                  >
                    <FiChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Help Inquiry */}
        <div className="mt-12 text-center">
          <p className="text-xs sm:text-sm text-slate-600 mb-3">
            আপনার কি অন্য কোনো সুনির্দিষ্ট প্রশ্ন রয়েছে?
          </p>
          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমার একটি প্রশ্ন রয়েছে যা আপনাদের সাইটে খুঁজে পাইনি। বিস্তারিত জানাবেন কি?")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-xs sm:text-sm underline underline-offset-4 transition"
          >
            <FaWhatsapp className="h-4 w-4 text-emerald-600" />
            <span>সরাসরি WhatsApp-এ প্রশ্ন করুন →</span>
          </a>
        </div>
      </div>
    </section>
  );
}

