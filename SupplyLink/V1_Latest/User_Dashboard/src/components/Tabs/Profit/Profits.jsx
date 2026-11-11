import React, { useState } from "react";
import Profit from "./Profit";
import ProfitHistory from "../ProfitHistory/ProfitHistory";
import { TrendingUp, History, Sparkles, PieChart } from "lucide-react";

const Profits = () => {
  const [activeTab, setActiveTab] = useState("investor");

  return (
    <div className="space-y-6">
      {/* 🔹 Header & Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              মুনাফা ও আর্থিক বিশ্লেষণ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            আপনার বিনিয়োগকৃত মূলধনের অর্জিত লাভ, মাসিক রিটার্ন ও উত্তোলন স্টেশন
          </p>
        </div>

        {/* 🔹 Segmented Pill Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("investor")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "investor"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>নিজস্ব লাভ ও উত্তোলন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("company")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>লাভের ইতিহাস</span>
          </button>
        </div>
      </div>

      {/* 🔹 Tab Content */}
      <div>
        {activeTab === "investor" && <Profit />}
        {activeTab === "company" && <ProfitHistory />}
      </div>
    </div>
  );
};

export default Profits;
