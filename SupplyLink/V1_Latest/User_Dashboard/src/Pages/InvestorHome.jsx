import React, { useState } from "react";
import { UserCheck, LineChart, TrendingUp, Building2 } from "lucide-react";
import InvestorHeroStats from "../components/InvestorHeroStats";
import Invest from "../components/Tabs/Invest/Invest";
import HomeReport from "../components/Tabs/Home/HomeReport";
import Profile from "../components/Tabs/Profile/Profile";
import Profits from "../components/Tabs/Profit/Profits";
import CompanySummary from "../components/Tabs/CompanySummary/CompanySummary";

const tabs = [
  // { id: "home", label: "হোম", shortLabel: "হোম", icon: Building2 },
  { 
    id: "profile", 
    label: "প্রোফাইল ও ব্যাংক", 
    shortLabel: "প্রোফাইল",
    icon: UserCheck 
  },
  { 
    id: "invest", 
    label: "বিনিয়োগ পোর্টফোলিও", 
    shortLabel: "বিনিয়োগ",
    icon: LineChart 
  },
  { 
    id: "profit", 
    label: "লাভ ও উত্তোলন", 
    shortLabel: "লাভ",
    icon: TrendingUp 
  },
  // { id: "company_summary", label: "সারসংক্ষেপ", shortLabel: "সারসংক্ষেপ", icon: Building2 },
];

const InvestorHome = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="w-full md:max-w-7xl mx-auto mt-4 md:mt-6 px-3 md:px-4 pb-28 md:pb-12">
      {/* 🧭 Desktop Segmented Pill Control (TOP OF THE PAGE) */}
      <div className="hidden md:flex justify-center mb-6">
        <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200/60 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 Step 1: Investor Header & 4-Metric Bento Grid */}
      <InvestorHeroStats />

      {/* 📱 Step 2: Mobile Floating Glass Dock */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-50">
        <nav className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] px-2 py-2 flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-50/80 text-indigo-600 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span className="text-[11px] tracking-tight">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 🔽 HOME TAB: সব কার্ড + ডিটেইলস */}
      {activeTab === "home" && <HomeReport />}

      {activeTab === "profile" && <Profile />}
      {activeTab === "invest" && <Invest />}
      {activeTab === "profit" && <Profits />}
      {activeTab === "company_summary" && <CompanySummary />}
    </div>
  );
};

export default InvestorHome;
