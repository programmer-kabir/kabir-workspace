import React from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import { getWhatsAppUrl } from "../../constants/links";

export default function TopAnnouncementBar({ onClose }) {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 text-slate-800 px-4 py-2 text-xs border-b border-indigo-200/80 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 text-center flex-wrap">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full text-[11px]">🔥 স্পেশাল অফার</span>
          <span className="text-slate-800 font-semibold">
            মাত্র ৩০% ডাউনপেমেন্টে যেকোনো অফিসিয়াল ফোন, বাইক ও গ্যাজেট কিস্তিতে নিন (৬ মাস ১০% • ১২ মাস ১৫% | হিডেন ফি ৳০)!
          </span>
          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি আপনাদের ৩০% ডাউনপেমেন্টের স্পেশাল অফারটি সম্পর্কে বিস্তারিত জানতে চাই।")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-4 ml-1 transition"
          >
            <span>অফার জানুন</span>
            <FiArrowRight className="h-3 w-3" />
          </a>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1 shrink-0 cursor-pointer"
            aria-label="Close Announcement"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
