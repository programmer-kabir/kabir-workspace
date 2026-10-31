import React, { useState, useMemo } from "react";
import { FiSliders, FiCheckCircle, FiDollarSign, FiZap, FiShield, FiPercent } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

export default function InstallmentCalculator() {
  const [activeTab, setActiveTab] = useState("customer"); // "customer" or "investor"

  // Customer EMI State
  const [mrp, setMrp] = useState(50000);
  const [tenure, setTenure] = useState(6); // strictly 6 or 12
  const [downPercent, setDownPercent] = useState(30); // 30% default

  // Investor Calculator State
  const [investAmount, setInvestAmount] = useState(100000);

  // Customer EMI Calculation (Strict Business Rule: 6 Mo = 10%, 12 Mo = 15%)
  const customerCalc = useMemo(() => {
    const price = Number(mrp) || 0;
    const downAmount = Math.round(price * (downPercent / 100));
    const remainingPrincipal = price - downAmount;

    // 6 months = 10%, 12 months = 15%
    const markupRate = tenure === 6 ? 0.10 : 0.15;
    const markupAmount = Math.round(remainingPrincipal * markupRate);
    const totalRemainingPayable = remainingPrincipal + markupAmount;
    const monthlyEmi = Math.ceil(totalRemainingPayable / tenure);

    return {
      downAmount,
      remainingPrincipal,
      markupRatePercent: tenure === 6 ? 10 : 15,
      markupAmount,
      totalRemainingPayable,
      monthlyEmi,
      totalCost: downAmount + totalRemainingPayable,
    };
  }, [mrp, tenure, downPercent]);

  // Investor Calculation (8% to 12% Monthly Halal Partnership Return)
  const investorCalc = useMemo(() => {
    const amount = Number(investAmount) || 0;
    const minMonthly = Math.round(amount * 0.08);
    const maxMonthly = Math.round(amount * 0.12);
    const minYearly = minMonthly * 12;
    const maxYearly = maxMonthly * 12;

    return {
      minMonthly,
      maxMonthly,
      minYearly,
      maxYearly,
    };
  }, [investAmount]);

  const presetPrices = [20000, 35000, 50000, 100000, 200000];
  const presetInvestments = [50000, 100000, 200000, 500000];

  const customerWaMessage = `হ্যালো SupplyLink, আমি কিস্তির হিসাব করেছি:\n- পণ্যের আনুমানিক মূল্য: ৳ ${mrp.toLocaleString()}\n- ডাউনপেমেন্ট (${downPercent}%): ৳ ${customerCalc.downAmount.toLocaleString()}\n- কিস্তির মেয়াদ: ${tenure} মাস (${customerCalc.markupRatePercent}% ফি)\n- মাসিক কিস্তি: ৳ ${customerCalc.monthlyEmi.toLocaleString()}\n\nআমি এই কিস্তি সুবিধায় পণ্য নিতে আগ্রহী। বিস্তারিত প্রক্রিয়া জানাবেন।`;

  const investorWaMessage = `হ্যালো SupplyLink, আমি একজন বিনিয়োগকারী হিসেবে ৳ ${investAmount.toLocaleString()} বিনিয়োগ করার পরিকল্পনা করছি।\nহিসাব অনুযায়ী মাসিক সম্ভাব্য আয় ৳ ${investorCalc.minMonthly.toLocaleString()} - ৳ ${investorCalc.maxMonthly.toLocaleString()}।\n৩০০ টাকার স্ট্যাম্পে আইনি চুক্তি ও বিনিয়োগের নিয়মাবলী জানতে চাই।`;

  return (
    <section id="calculator" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/60 relative">
      <div className=" mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-6xl mx-auto mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            স্বচ্ছ ও নির্ভরযোগ্য আর্থিক হিসাব
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            স্মার্ট ফাইন্যান্সিয়াল ক্যালকুলেটর
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            গ্রাহকদের জন্য সুনির্দিষ্ট ৬ ও ১২ মাসের কিস্তি হিসাব এবং বিনিয়োগকারীদের জন্য স্বচ্ছ মাসিক মুনাফার লাইভ সিমুলেটর।
          </p>
        </div>

        {/* Dual Tab Mode Switcher */}
        <div className="max-w-2xl mx-auto mb-12 flex rounded-2xl bg-white p-1.5 border border-slate-200/90 shadow-sm">
          <button
            onClick={() => setActiveTab("customer")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === "customer"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <span>🛍️ কিস্তি ক্যালকুলেটর (গ্রাহক)</span>
          </button>
          <button
            onClick={() => setActiveTab("investor")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === "investor"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <span>💼 বিনিয়োগ ক্যালকুলেটর (ইনভেস্টর)</span>
          </button>
        </div>

        {/* ================= TAB 1: CUSTOMER EMI CALCULATOR ================= */}
        {activeTab === "customer" && (
          <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Price Range Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <FiSliders className="text-indigo-600" />
                      <span>পণ্যের বাজার মূল্য (MRP)</span>
                    </label>
                    <span className="font-mono text-lg font-black text-indigo-600">
                      ৳ {Number(mrp).toLocaleString()}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10000"
                    max="265000"
                    step="1000"
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  {/* Preset Quick Buttons */}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {presetPrices.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setMrp(preset)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${mrp === preset
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                      >
                        ৳ {(preset / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Tenure Selection: Strictly 6 Months (10%) & 12 Months (15%) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-700">
                      কিস্তির মেয়াদ নির্বাচন করুন
                    </label>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {tenure === 6 ? "১০% ফি" : "১৫% ফি"} (কোনো হিডেন ফি নেই)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTenure(6)}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${tenure === 6
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">৬ মাসের কিস্তি</span>
                        <span className="rounded-md bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5">
                          ১০% ফি
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        স্বল্প মেয়াদে কম অতিরিক্ত খরচে পরিশোধ
                      </p>
                    </button>

                    <button
                      onClick={() => setTenure(12)}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${tenure === 12
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">১২ মাসের কিস্তি</span>
                        <span className="rounded-md bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5">
                          ১৫% ফি
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        ছোট ছোট কিস্তিতে নিশ্চিন্তে ১ বছরে পরিশোধ
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Downpayment (30%) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-700">
                      ডাউনপেমেন্ট (ন্যূনতম ৩০%)
                    </label>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      ৳ {customerCalc.downAmount.toLocaleString()} ({downPercent}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[30, 40, 50].map((dp) => (
                      <button
                        key={dp}
                        onClick={() => setDownPercent(dp)}
                        className={`py-2 rounded-xl font-bold text-xs transition cursor-pointer ${downPercent === dp
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                      >
                        {dp}% ডাউনপেমেন্ট
                      </button>
                    ))}
                  </div>
                </div>

                {/* Early Payoff Discount Highlight Note */}
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                  <FiPercent className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">আগাম পরিশোধে বিশেষ ছাড়:</span>
                    <span className="text-amber-800 ml-1">
                      মেয়াদ শেষ হওয়ার আগেই যদি আপনি এককালীন সমস্ত টাকা পরিশোধ করেন, তবে ফির ওপর বিশেষ ছাড় বা রিবেট সুবিধা দেওয়া হবে।
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Display: Live Output Card */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-6 sm:p-7 text-slate-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-3 py-1 rounded-full mb-4">
                    কিস্তির সারসংক্ষেপ ({tenure} মাস)
                  </span>

                  <div className="mb-6">
                    <span className="text-xs text-slate-500 block font-medium">
                      প্রতি মাসে কিস্তি দিতে হবে
                    </span>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 mt-1">
                      ৳ {customerCalc.monthlyEmi.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500 font-sans">
                        {" "}
                        /মাস
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-5 border-t border-slate-200 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>ডাউনপেমেন্ট ({downPercent}%)</span>
                      <span className="font-mono font-bold text-slate-900">
                        ৳ {customerCalc.downAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>কিস্তির মেয়াদ</span>
                      <span className="font-bold text-slate-900">{tenure} মাস ({customerCalc.markupRatePercent}% ফি)</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>লুকানো ফি</span>
                      <span className="font-bold text-emerald-600">৳ ০ (শূন্য)</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>সর্বমোট প্রদেয়</span>
                      <span className="font-mono font-bold text-slate-900">
                        ৳ {customerCalc.totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <a
                    href={getWhatsAppUrl(customerWaMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <FaWhatsapp className="h-4 w-4" />
                    <span>এই কিস্তিতে WhatsApp-এ নিশ্চিত করুন</span>
                  </a>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    ✓ কোনো ক্রেডিট কার্ড বা ব্যাংক অ্যাকাউন্ট প্রয়োজন নেই
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: INVESTOR PROFIT CALCULATOR ================= */}
        {activeTab === "investor" && (
          <div className="max-w-7xl mx-auto rounded-3xl border border-indigo-200/90 bg-white p-6 sm:p-10 shadow-xl animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <FiSliders className="text-indigo-600" />
                      <span>আপনার মূলধনের পরিমাণ (বিনিয়োগ)</span>
                    </label>
                    <span className="font-mono text-xl font-black text-indigo-600">
                      ৳ {Number(investAmount).toLocaleString()}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="10000"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  {/* Preset Investment Pills */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {presetInvestments.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setInvestAmount(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${investAmount === preset
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                      >
                        ৳ {(preset / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                {/* Investment Feature Highlights */}
                <div className="space-y-3 pt-2">
                  <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100 flex items-start gap-3">
                    <FiShield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-bold text-slate-900">৩০০ টাকার সরকারি স্ট্যাম্পে আইনি চুক্তি</h4>
                      <p className="text-slate-600 mt-0.5">
                        প্রতিটি বিনিয়োগকারীর মূলধনের পূর্ণ সুরক্ষায় আইনি চুক্তিপত্র ও সিকিউরিটি ডকুমেন্টস প্রদান করা হয়।
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100 flex items-start gap-3">
                    <FiCheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-bold text-slate-900">হালাল ব্যবসায়িক অংশীদারিত্ব ও লভ্যাংশ</h4>
                      <p className="text-slate-600 mt-0.5">
                        কোনো অনিশ্চিত বা জুয়ার ব্যবসা নয়; সরাসরি স্মার্টফোন ও বাইকের কিস্তি বাণিজ্যের মুনাফা বণ্টন।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Output: Live Profit Display */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border-2 border-emerald-600 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-6 sm:p-7 text-slate-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-4">
                    সম্ভাব্য লাভ সিমুলেটর (৮%–১২%)
                  </span>

                  <div className="mb-6">
                    <span className="text-xs text-slate-500 block font-medium">
                      সম্ভাব্য মাসিক মুনাফা আয়
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 mt-1">
                      ৳ {investorCalc.minMonthly.toLocaleString()} – ৳ {investorCalc.maxMonthly.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3 pt-5 border-t border-slate-200 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>বিনিয়োগকৃত মূলধন</span>
                      <span className="font-mono font-bold text-slate-900">
                        ৳ {investAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>সম্ভাব্য বাৎসরিক আয়</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ৳ {investorCalc.minYearly.toLocaleString()} – ৳ {investorCalc.maxYearly.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>লভ্যাংশ পেআউট মাধ্যম</span>
                      <span className="font-bold text-slate-900">ব্যাংক / বিকাশ / নগদ</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <a
                    href={getWhatsAppUrl(investorWaMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <FaWhatsapp className="h-4 w-4" />
                    <span>বিনিয়োগ চুক্তিপত্র নিয়ে WhatsApp-এ কথা বলুন</span>
                  </a>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    ✓ সরাসরি সুনামগঞ্জ সদর অফিসে এসে চুক্তি সম্পাদনের সুযোগ
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
