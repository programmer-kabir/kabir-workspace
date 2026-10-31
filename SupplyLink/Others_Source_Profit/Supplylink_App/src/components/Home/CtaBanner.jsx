import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiPhoneCall, FiCheckCircle } from "react-icons/fi";
import { CONTACT_INFO, getWhatsAppUrl } from "../../constants/links";

export default function CtaBanner() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden px-6 py-12 sm:p-16 text-center bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 text-slate-900 shadow-xl border-2 border-indigo-200/90">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-4">
              দ্রুত ও ঝামেলাহীন শুরু
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
              আপনার আর্থিক প্রয়োজন করুন{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                স্মার্ট ও সহজ
              </span>
            </h2>

            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              আজই SupplyLink-এর সাথে যুক্ত হয়ে কিস্তিতে সহজ কেনাকাটা করুন অথবা একজন যাচাইকৃত বিনিয়োগকারী হিসেবে হালাল মুনাফা অর্জন করুন।
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {/* WhatsApp Button */}
              <a
                href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তিতে পণ্য কেনা অথবা বিনিয়োগ সম্পর্কে কথা বলতে চাই।")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-green-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <FaWhatsapp className="h-5 w-5" />
                <span>WhatsApp-এ সরাসরি আবেদন</span>
              </a>

              {/* Call Button */}
              <a
                href={`tel:${CONTACT_INFO.callNumber}`}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border-2 border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-sm sm:text-base transition-all shadow-sm"
              >
                <FiPhoneCall className="h-4 w-4 text-indigo-600" />
                <span>কল করুন: {CONTACT_INFO.callNumber}</span>
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-600" />
                ৬ মাস (১০%) ও ১২ মাস (১৫%) ফিক্সড ফি
              </span>
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-600" />
                হিডেন ফি ৳০ • আগে দিলে ছাড়
              </span>
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-600" />
                ৩০০ টাকার সরকারি স্ট্যাম্প চুক্তি
              </span>
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="text-emerald-600" />
                সুনামগঞ্জ সদর লোকাল অফিস
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
