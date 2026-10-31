import React from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiX, FiShield, FiZap, FiArrowRight, FiPercent } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const COMPARISONS = [
  {
    feature: "কিস্তির মেয়াদ ও ফিক্সড ফি",
    traditional: "অস্পষ্ট ও চক্রবৃদ্ধি সুদ, মেয়াদে অতিরিক্ত গোপন চার্জ",
    supplylink: "স্বচ্ছ ৬ মাস (১০% ফি) ও ১২ মাস (১৫% ফি), হিডেন ফি ৳০",
  },
  {
    feature: "মেয়াদপূর্ব পরিশোধে ছাড় (Rebate)",
    traditional: "আগে পরিশোধে কোনো ছাড় নেই, উল্টো প্রি-ক্লোজার পেনাল্টি",
    supplylink: "মেয়াদের আগে এককালীন দিলে ফিতে বিশেষ রিবেট / ছাড় সুবিধা",
  },
  {
    feature: "সুদের চাপ ও স্বচ্ছতা",
    traditional: "চড়া সুদের জটিল হিসাব ও প্রতি পদে অতিরিক্ত প্রসেসিং ফি",
    supplylink: "কোনো সুদ বা লুকানো ফি নেই, শুরুতেই শতভাগ স্বচ্ছ মেমো",
  },
  {
    feature: "ক্রেডিট কার্ড ও ব্যাংকিং",
    traditional: "ক্রেডিট কার্ড ও জটিল ব্যাংক স্টেটমেন্ট বাধ্যতামূলক",
    supplylink: "কোনো কার্ড বা চেকের ঝামেলা নেই, শুধু NID ও ১ কপি ছবি",
  },
  {
    feature: "যাচাই ও অনুমোদন সময়",
    traditional: "৫ থেকে ৭ দিন দীর্ঘ কাগজের যাচাই ও একাধিকবার দৌড়ঝাঁপ",
    supplylink: "মাত্র ৩ মিনিটে তাৎক্ষণিক প্রাথমিক অনলাইন যাচাই ও অনুমোদন",
  },
  {
    feature: "ডাউনপেমেন্টের নমনীয়তা",
    traditional: "৫০% বা তার বেশি উচ্চ ডাউনপেমেন্ট দাবি করা হয়",
    supplylink: "মাত্র ৩০% নমনীয় ডাউনপেমেন্টে অফিসিয়াল পণ্য গ্রহণের সুযোগ",
  },
  {
    feature: "পণ্য ওয়ারেন্টি ও জেনুইনিটি",
    traditional: "ক্লোন, রিফার্বিশড বা গ্রে মার্কেটের পণ্যের ঝুঁকি থাকে",
    supplylink: "১০০% ব্র্যান্ড নিউ অফিসিয়াল মেমো ও অথরাইজড ওয়ারেন্টি",
  },
  {
    feature: "গ্রাহক সেবা ও যোগাযোগ",
    traditional: "অফিসে বারবার যাওয়া ও দীর্ঘ অপেক্ষার ভোগান্তি",
    supplylink: "সরাসরি WhatsApp-এ সার্বক্ষণিক ডেডিকেটেড ভিআইপি সাপোর্ট",
  },
];

export default function ComparisonTable() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/60 relative">
      <div className=" mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            কেন আমরা সেরা ও অনন্য
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            সাধারণ কিস্তি বনাম SupplyLink আধুনিক কিস্তি
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            নিচের তুলনাটি দেখলেই বুঝতে পারবেন কেন সচেতন ক্রেতারা SupplyLink-কে বেছে নিচ্ছেন।
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Left: Traditional (Other options) */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold">
                  ✕
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    সাধারণ মাধ্যম / অন্যান্য প্রতিষ্ঠান
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    সনাতন ও জটিল কিস্তি ব্যবস্থা
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {COMPARISONS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 mt-0.5">
                      <FiX className="h-3 w-3 stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">
                        {item.feature}:
                      </span>
                      <span className="text-slate-600">{item.traditional}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-200 text-center">
              <span className="text-xs text-rose-600 font-bold">
                অতিরিক্ত সময় ও টাকার অপচয়
              </span>
            </div>
          </div>

          {/* Right: SupplyLink (Winner) */}
          <div className="relative rounded-3xl border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/40 p-6 sm:p-8 text-slate-900 shadow-xl flex flex-col justify-between">
            {/* Top Winner Ribbon */}
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <FiZap className="h-3 w-3" />
              <span>স্মার্ট চয়েস</span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="https://supplylinkbd.com/img/logo/sl_logo.webp"
                  alt="SupplyLink"
                  className="h-9 w-auto object-contain"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    SupplyLink প্ল্যাটফর্ম
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    আধুনিক, দ্রুত ও শতভাগ স্বচ্ছ
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {COMPARISONS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shadow-xs font-bold">
                      <FiCheck className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-bold text-indigo-700 block text-[11px]">
                        {item.feature}:
                      </span>
                      <span className="text-slate-800 font-medium">{item.supplylink}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-200 space-y-2.5">
              <a
                href={getWhatsAppUrl("হ্যালো SupplyLink, আমি আপনাদের সহজ কিস্তিতে পণ্য নেওয়ার শর্তাবলী জানতে চাই।")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <FaWhatsapp className="h-4 w-4" />
                <span>আজই WhatsApp-এ কিস্তি শুরু করুন</span>
              </a>

              <Link
                to="/installment-rules"
                className="flex items-center justify-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 py-1 transition-colors font-semibold"
              >
                <span>কিস্তির বিস্তারিত নিয়ম ও ছাড় পলিসি দেখুন</span>
                <FiArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

