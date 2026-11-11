import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiX, FiSmartphone, FiTrendingUp, FiPhoneCall, FiChevronRight } from "react-icons/fi";
import { FaMotorcycle } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);

  const quickOptions = [
    {
      title: "স্মার্টফোন কিস্তিতে বুকিং",
      desc: "Redmi, Realme, Vivo, Oppo, Samsung",
      icon: FiSmartphone,
      color: "bg-blue-50 text-blue-600",
      msg: "হ্যালো SupplyLink, আমি ৬ মাস (১০%) বা ১২ মাস (১৫%) মেয়াদে একটি অফিসিয়াল স্মার্টফোন কিস্তিতে বুক করতে আগ্রহী। এর প্রক্রিয়া জানাবেন।",
    },
    {
      title: "মোটরসাইকেল কিস্তির আবেদন",
      desc: "Suzuki, Hero, Honda, Yamaha বাইক",
      icon: FaMotorcycle,
      color: "bg-emerald-50 text-emerald-600",
      msg: "হ্যালো SupplyLink, আমি কিস্তিতে মোটরসাইকেল নেওয়ার ৩০% ডাউনপেমেন্ট এবং ৬ মাস/১২ মাসের মাসিক কিস্তি জানতে চাই।",
    },
    {
      title: "বিনিয়োগে মাসিক মুনাফা আলোচনা",
      desc: "৮%–১২% মাসিক সম্ভাব্য আয় (স্ট্যাম্প চুক্তি)",
      icon: FiTrendingUp,
      color: "bg-purple-50 text-purple-600",
      msg: "হ্যালো SupplyLink, আমি একজন বিনিয়োগকারী হিসেবে ৩০০ টাকার স্ট্যাম্প চুক্তিতে মূলধন বিনিয়োগের বিস্তারিত নিয়ম জানতে চাই।",
    },
    {
      title: "সরাসরি প্রতিনিধির সাথে চ্যাট",
      desc: "তাৎক্ষণিক সহায়তা ও তথ্য",
      icon: FiPhoneCall,
      color: "bg-amber-50 text-amber-600",
      msg: "হ্যালো SupplyLink, আমি কাস্টমার প্রতিনিধির সাথে সরাসরি কথা বলতে চাই।",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[140] flex flex-col items-end">
      {/* Luxury Mini Chat Popup Window */}
      {isOpen && (
        <div className="mb-3 w-[90vw] sm:w-[350px] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <FaWhatsapp className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">SupplyLink সাপোর্ট</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-100 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>অনলাইনে সক্রিয়</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
              aria-label="Close Chat"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 bg-slate-50 text-slate-800">
            <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs text-xs text-slate-600 leading-relaxed mb-3">
              👋 আসসালামু আলাইকুম! আপনাকে কীভাবে সহায়তা করতে পারি? নিচের যেকোনো টপিকে ট্যাপ করে সরাসরি WhatsApp-এ বার্তা পাঠান:
            </div>

            {/* Quick Option Buttons */}
            <div className="space-y-2">
              {quickOptions.map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <a
                    key={i}
                    href={getWhatsAppUrl(opt.msg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${opt.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {opt.title}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {opt.desc}
                        </span>
                      </div>
                    </div>
                    <FiChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open WhatsApp Support"
        className="relative group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-xl shadow-green-500/35 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50 active:scale-95 cursor-pointer"
      >
        {/* Pulsing ring when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-40 animate-ping pointer-events-none"></span>
        )}

        {isOpen ? (
          <FiX className="h-6 w-6" />
        ) : (
          <FaWhatsapp className="h-7 w-7 transition-transform group-hover:scale-110" />
        )}

        {/* Online Badge */}
        {!isOpen && (
          <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-slate-900"></span>
        )}
      </button>
    </div>
  );
}
