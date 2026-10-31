import React from "react";
import { Link } from "react-router-dom";
import { FiCreditCard, FiTruck, FiUserCheck, FiCheck, FiArrowRight } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const steps = [
  {
    stepNum: "০১",
    icon: <FiUserCheck className="h-6 w-6 text-indigo-600" />,
    title: "সহজ তথ্য ও আবেদন প্রদান",
    desc: "আমাদের WhatsApp-এ সরাসরি যোগাযোগ করুন অথবা আপনার পছন্দের পণ্যের নামসহ আবেদন পাঠান। আমাদের প্রতিনিধি দ্রুত আপনার আবেদন রিসিভ করবেন।",
    requirements: [
      "জাতীয় পরিচয়পত্র (NID) এর স্পষ্ট ছবি",
      "১ কপি পাসপোর্ট সাইজ ছবি",
      "একজন পরিচিত গ্যারান্টরের NID",
      "সক্রিয় মোবাইল নম্বর ও বর্তমান ঠিকানা",
    ],
  },
  {
    stepNum: "০২",
    icon: <FiCreditCard className="h-6 w-6 text-purple-600" />,
    title: "যাচাই ও কিস্তি প্ল্যান নির্ধারণ",
    desc: "আপনার সুবিধার সাথে মিল রেখে ৬ মাস (১০% ফি) অথবা ১২ মাস (১৫% ফি) মেয়াদে কিস্তি নির্বাচন করুন। কোনো হিডেন চার্জ নেই, আগে পরিশোধ করলে মার্জিনে ছাড়!",
    requirements: [
      "মাত্র ৩০% ন্যূনতম ডাউনপেমেন্ট",
      "৬ মাস (১০%) ও ১২ মাস (১৫%) ফিক্সড ফি",
      "আগে সম্পূর্ণ পরিশোধে বিশেষ ক্যাশব্যাক / ছাড়",
      "হিডেন ফি ৳০ • ১০০% স্বচ্ছ চুক্তি",
    ],
  },
  {
    stepNum: "০৩",
    icon: <FiTruck className="h-6 w-6 text-emerald-600" />,
    title: "পণ্য গ্রহণ ও কিস্তি পরিশোধ",
    desc: "অনুমোদন ও ডাউনপেমেন্ট সম্পন্ন হলে নির্ধারিত সময়ের মধ্যে অফিসিয়াল পণ্য আপনার হাতে পৌঁছে যাবে। এরপর প্রতি মাসে সহজভাবে কিস্তি পরিশোধ করুন।",
    requirements: [
      "দ্রুত ও নিরাপদ ডেলিভারি ব্যবস্থা",
      "অফিসিয়াল ওয়ারেন্টি ও মেমো প্রদান",
      "বিকাশ/নগদ/ব্যাংকের মাধ্যমে কিস্তি প্রদান",
      "সার্বক্ষণিক ডেডিকেটেড সাপোর্ট",
    ],
  },
];

export function HowSLWorks() {
  return (
    <section id="how-it-works" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/60">
      <div className=" mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            সহজ ৩ ধাপের প্রক্রিয়া
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            কিস্তিতে কেনাকাটা কীভাবে কাজ করে?
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            কোনো জটিল ব্যাংকিং প্রক্রিয়া বা ক্রেডিট কার্ডের ঝামেলা ছাড়া ৩টি সহজ পদক্ষেপে আপনার স্বপ্নের পণ্যটি কিনুন।
          </p>
        </div>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative flex flex-col rounded-3xl border border-slate-200/90 bg-slate-50/50 p-7 shadow-sm hover:shadow-xl hover:border-indigo-400/50 transition-all duration-300"
            >
              {/* Step Number Top Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
                  {item.icon}
                </div>
                <span className="font-mono text-3xl font-black text-slate-300">
                  {item.stepNum}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {item.desc}
              </p>

              {/* Requirements Checklist */}
              <div className="mt-auto pt-4 border-t border-slate-200/80 space-y-2">
                {item.requirements.map((req, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 text-xs text-slate-700">
                    <FiCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Fast Action & Details Link */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/installment-rules"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border-2 border-indigo-600 text-indigo-700 bg-white hover:bg-indigo-50 font-bold text-sm sm:text-base shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <span>কিস্তির বিস্তারিত নিয়ম ও ছাড় পলিসি দেখুন</span>
            <FiArrowRight className="h-4 w-4" />
          </Link>

          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তিতে পণ্য নেওয়ার জন্য প্রয়োজনীয় কাগজপত্র জমা দিতে চাই।")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-green-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <FaWhatsapp className="h-5 w-5" />
            <span>এখনই WhatsApp-এ আবেদন করুন</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default HowSLWorks;
