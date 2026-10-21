import React, { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { MONTHS } from "../../../../../public/month";
import { 
  Coins, 
  Layers, 
  Sliders, 
  Bike, 
  Building2,
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  Clock,
  Lock,
  ShieldCheck
} from "lucide-react";

/* ================= HELPERS ================= */
const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

const Monthly_Profit_Distributor = () => {
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  /* 🔥 FILTER STATES */
  const [mode, setMode] = useState("monthly");
  const [month, setMonth] = useState(prevMonthDate.getMonth() + 1);
  const [year, setYear] = useState(prevMonthDate.getFullYear());

  /* 🔥 PROFIT POOLS & SLIDER STATES */
  const [rentalInvestorPercent, setRentalInvestorPercent] = useState(70);
  const [shareInvestorPercent, setShareInvestorPercent] = useState(70);
  const [distributionData, setDistributionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const START_YEAR = 2024;

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let y = START_YEAR; y <= currentYear; y++) {
      arr.push(y);
    }
    return arr;
  }, []);

  const availableMonths = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    return MONTHS.filter((m) => {
      if (year < currentYear) return true;
      if (year === currentYear) return m.value < currentMonth;
      return false;
    });
  }, [year]);

  /* ================= FETCH SERVER-SIDE CALCULATION ================= */
  const fetchDistribution = useCallback(async (rPct, sPct) => {
    setIsLoading(true);
    try {
      const activeRentalPct = (rPct !== undefined) ? rPct : rentalInvestorPercent;
      const activeSharePct = (sPct !== undefined) ? sPct : shareInvestorPercent;
      const url = `${import.meta.env.VITE_LOCALHOST_KEY}/profit_generator/calculate_monthly_distribution.php?year=${year}&month=${month}&rental_investor_percent=${activeRentalPct}&share_investor_percent=${activeSharePct}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data?.success) {
        setDistributionData(data);
        if (data.rentalInvestorPercent != null) {
          setRentalInvestorPercent(Number(data.rentalInvestorPercent));
        }
        if (data.shareInvestorPercent != null) {
          setShareInvestorPercent(Number(data.shareInvestorPercent));
        }
      } else {
        toast.error(data?.message || "হিসাব আনতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error("Fetch distribution failed:", err);
      toast.error("সার্ভার এরর: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, rentalInvestorPercent, shareInvestorPercent]);

  useEffect(() => {
    fetchDistribution();
  }, [year, month]);

  // Fast local re-scaling for instant UI feedback (345 rows in memory is 0.001s)
  const recalculateDistribution = (rPct, sPct) => {
    if (!distributionData) return;

    const cardPool = distributionData.cardInvestorPool || 0;
    const cardCompany = distributionData.cardCompanyProfit || 0;

    const rentalTotal = distributionData.rentalTotalProfit || 0;
    const rentalPool = (rentalTotal * rPct) / 100;
    const rentalCompany = rentalTotal - rentalPool;

    const shareTotal = distributionData.shareTotalProfit || 0;
    const sharePool = (shareTotal * sPct) / 100;
    const shareCompany = shareTotal - sharePool;

    const othersTotal = rentalTotal + shareTotal;
    const othersPool = rentalPool + sharePool;
    const othersCompany = rentalCompany + shareCompany;

    const combinedTotal = (distributionData.cardTotalProfit || 0) + othersTotal;
    const combinedCompany = cardCompany + othersCompany;
    const combinedInvestor = cardPool + othersPool;
    const totalWV = distributionData.totalWV || 0;

    const updatedRows = (distributionData.rows || []).map((r) => {
      if (!r.weighted_value) return r;
      const ratio = totalWV > 0 ? r.weighted_value / totalWV : 0;
      const cardProfit = round4(cardPool * ratio);
      const rentalProfit = round4(rentalPool * ratio);
      const shareProfit = round4(sharePool * ratio);
      const othersProfit = round4(rentalProfit + shareProfit);
      let profit = round4(cardProfit + othersProfit);
      let percent = round4(ratio * 100);

      let note = `কার্ড: ৳${cardProfit} | রেন্টাল: ৳${rentalProfit} | বিজনেস শেয়ার: ৳${shareProfit}`;

      if (Number(r.cardId) === 2) { // COMPANY_CARD_ID
        const compCardProfit = round4(cardProfit + cardCompany);
        const compRentalProfit = round4(rentalProfit + rentalCompany);
        const compShareProfit = round4(shareProfit + shareCompany);
        const compOthersProfit = round4(compRentalProfit + compShareProfit);
        const compTotalProfit = round4(compCardProfit + compOthersProfit);
        const compPercent = combinedTotal > 0 ? round4((compTotalProfit / combinedTotal) * 100) : 0;
        const compNote = `কোম্পানি অংশ (কার্ড ৫০%: ৳${cardCompany} + রেন্টাল ${100 - rPct}%: ৳${round4(rentalCompany)} + বিজনেস শেয়ার ${100 - sPct}%: ৳${round4(shareCompany)})`;

        return {
          ...r,
          percent: compPercent,
          cardProfit: compCardProfit,
          rentalProfit: compRentalProfit,
          shareProfit: compShareProfit,
          othersProfit: compOthersProfit,
          profit: compTotalProfit,
          note: compNote,
        };
      }

      return {
        ...r,
        percent,
        cardProfit,
        rentalProfit,
        shareProfit,
        othersProfit,
        profit,
        note,
      };
    });

    setDistributionData((prev) => ({
      ...prev,
      rentalInvestorPercent: rPct,
      rentalInvestorPool: round4(rentalPool),
      rentalCompanyProfit: round4(rentalCompany),
      shareInvestorPercent: sPct,
      shareInvestorPool: round4(sharePool),
      shareCompanyProfit: round4(shareCompany),
      othersTotalProfit: round4(othersTotal),
      othersInvestorPool: round4(othersPool),
      othersCompanyProfit: round4(othersCompany),
      companyProfit: round4(combinedCompany),
      investorPoolProfit: round4(combinedInvestor),
      totalProfit: round4(combinedTotal),
      rows: updatedRows,
    }));
  };

  const handleRentalSliderChange = (newPct) => {
    setRentalInvestorPercent(newPct);
    recalculateDistribution(newPct, shareInvestorPercent);
  };

  const handleShareSliderChange = (newPct) => {
    setShareInvestorPercent(newPct);
    recalculateDistribution(rentalInvestorPercent, newPct);
  };

  const ui = {
    rows: [],
    cardTotalProfit: 0,
    cardCompanyProfit: 0,
    cardInvestorPool: 0,
    rentalTotalProfit: 0,
    rentalInvestorPercent: rentalInvestorPercent,
    rentalInvestorPool: 0,
    rentalCompanyProfit: 0,
    shareTotalProfit: 0,
    shareInvestorPercent: shareInvestorPercent,
    shareInvestorPool: 0,
    shareCompanyProfit: 0,
    othersTotalProfit: 0,
    othersInvestorPool: 0,
    othersCompanyProfit: 0,
    totalProfit: 0,
    investorPoolProfit: 0,
    totalWV: 0,
    ...(distributionData || {}),
    companyProfit: distributionData?.companyProfit ?? distributionData?.totalCompanyProfit ?? 0,
  };

  const monthName = (id) => {
    const name = MONTHS.find((m) => m.value === id);
    return name?.label || id;
  };

  const handleSaveMonthly = async () => {
    try {
      if (mode !== "monthly")
        return toast.error("Only Monthly mode can be saved.");

      const rows = ui.rows || [];
      if (!rows.length) return toast.error("No rows to save.");

      setIsSaving(true);

      const payloadRows = rows
        .filter((r) => r.cardId)
        .map((r) => ({
          investor_id: r.investor_id,
          card_id: r.cardId,
          start_date: r.start_date || null,
          maturity_date: r.maturity_date || null,
          profit_month: month,
          profit_year: year,
          weight_value: Number(r.weighted_value || 0),
          percent: Number(r.percent || 0),
          amount: Number(r.deposit_this_month || 0),
          profit_amount: Number(r.profit || 0),
          status: "pending",
          note: r.note || null,
        }));

      if (!payloadRows.length) {
        setIsSaving(false);
        return toast.error("No valid card rows found to save.");
      }

      // 1. Save standard profit generator
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/profit_generator/save_profit_generator_monthly.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rows: payloadRows }),
        },
      );
      const data = await res.json();

      if (!data?.success) {
        setIsSaving(false);
        return toast.error(data?.message || "Save failed");
      }

      // 2. Save Others Source & Share distribution record for auditing
      try {
        const monthKey = `${year}-${String(month).padStart(2, "0")}`;
        await fetch(
          `${import.meta.env.VITE_LOCALHOST_KEY}/other_sources/save_monthly_distribution.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              billing_month: monthKey,
              card_profit: ui.cardTotalProfit,
              others_profit: ui.othersTotalProfit,
              others_investor_percent: rentalInvestorPercent,
              others_investor_pool: ui.othersInvestorPool,
              others_company_pool: ui.othersCompanyProfit,
              rental_profit: ui.rentalTotalProfit,
              rental_investor_percent: rentalInvestorPercent,
              rental_investor_pool: ui.rentalInvestorPool,
              rental_company_pool: ui.rentalCompanyProfit,
              share_profit: ui.shareTotalProfit,
              share_investor_percent: shareInvestorPercent,
              share_investor_pool: ui.shareInvestorPool,
              share_company_pool: ui.shareCompanyProfit,
              total_investor_pool: ui.investorPoolProfit,
            }),
          }
        );
      } catch (err) {
        console.warn("Could not save others distribution audit:", err);
      }

      toast.success(
        `প্রফিট সফলভাবে সংরক্ষিত! কার্ড, রেন্টাল ও বিজনেস শেয়ার প্রফিট সহ মোট ${payloadRows.length}টি কার্ড আপডেট করা হয়েছে।`
      );

      // Re-fetch to immediately lock the month
      await fetchDistribution();
    } catch (err) {
      toast.error("Save error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 text-white mx-auto space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            {distributionData?.is_locked ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Official Saved Ledger (Locked)</span>
                {ui.execution_time_ms && (
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ui.execution_time_ms}
                  </span>
                )}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>High-Speed Server Engine (Fast & Precision Math)</span>
                {ui.execution_time_ms && (
                  <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ui.execution_time_ms}
                  </span>
                )}
              </>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Profit Distribution — {monthName(month)} {year}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            পণ্য কিস্তি, রেন্টাল সম্পদ ও বিজনেস শেয়ার হোল্ডিং লভ্যাংশের নিখুঁত ও দ্রুত সম্মিলিত বণ্টন
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDistribution()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {distributionData?.is_locked ? (
            <div className="inline-flex items-center gap-2 bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 px-5 py-2.5 rounded-xl font-medium text-sm shadow-inner cursor-not-allowed select-none">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>ইতিমধ্যে সংরক্ষিত (Saved & Locked)</span>
            </div>
          ) : (
            <button
              onClick={handleSaveMonthly}
              disabled={isSaving || isLoading}
              className={`
                group relative inline-flex items-center gap-2
                bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
                active:scale-[0.98] transition-all duration-200
                px-6 py-2.5 rounded-xl font-semibold text-white text-sm
                shadow-lg shadow-emerald-950/40 border border-emerald-500/30
                ${isSaving || isLoading ? "opacity-60 cursor-not-allowed" : ""}
              `}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition" />
              <span>{isSaving ? "সংরক্ষণ করা হচ্ছে..." : "Save Monthly Profit"}</span>
            </button>
          )}
        </div>
      </div>

      {/* LOCKED STATUS BANNER */}
      {distributionData?.is_locked && (
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 border border-emerald-700/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-200">
                এই মাসের মুনাফা বণ্টন চূড়ান্তভাবে সংরক্ষিত ও লক করা হয়েছে (Official Saved Ledger)
              </p>
            </div>
          </div>
          <span className="shrink-0 bg-emerald-900/90 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-semibold border border-emerald-700/60 flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Locked Ledger
          </span>
        </div>
      )}

      {/* ================= FILTER BAR ================= */}
      <div className="flex gap-4 justify-center flex-wrap bg-slate-900/60 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="monthly">Monthly Distribution</option>
          <option value="yearly_sum">Yearly (Sum of 12 months)</option>
        </select>

        {mode === "monthly" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            disabled={!availableMonths?.length}
            className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50 focus:outline-none focus:border-cyan-500"
          >
            {!availableMonths?.length ? (
              <option value={month}>No completed month for {year}</option>
            ) : (
              availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))
            )}
          </select>
        )}

        <select
          value={year}
          onChange={(e) => {
            const newYear = Number(e.target.value);
            setYear(newYear);
            if (mode === "monthly" && availableMonths?.length) {
              const firstValid = availableMonths[0]?.value;
              if (firstValid) setMonth(firstValid);
            }
          }}
          className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
        >
          {years?.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* ================= 4 PROFIT POOL CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* POOL 1: PRODUCT CARD SALES (50/50 Fixed) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 p-4.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">পণ্য কিস্তি প্রফিট পুল</h3>
                  <span className="text-[11px] text-cyan-400 font-medium">Customer Cards (50% Fixed)</span>
                </div>
              </div>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 font-semibold">
                Card Profit
              </span>
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">মোট কিস্তি মুনাফা:</span>
                <span className="font-bold text-white text-sm">৳ {Number(ui.cardTotalProfit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-yellow-400/90 pt-1.5 border-t border-white/5">
                <span>কোম্পানি অংশ (৫০%):</span>
                <span className="font-semibold">৳ {Number(ui.cardCompanyProfit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-cyan-400 font-bold pt-1.5 border-t border-white/5">
                <span>ইনভেস্টর পুল (৫০%):</span>
                <span className="text-sm">৳ {Number(ui.cardInvestorPool || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* POOL 2: RENTAL / LEASE ASSETS (Flexible Admin Slider) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 p-4.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">অন্যান্য সম্পদ প্রফিট পুল</h3>
                  <span className="text-[11px] text-purple-400 font-medium">Lease / Rental Assets</span>
                </div>
              </div>
              <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800 font-semibold">
                Rental Assets
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">আদায়কৃত রেন্টাল প্রফিট:</span>
                <span className="font-bold text-purple-300 text-sm">
                  ৳ {Number(ui.rentalTotalProfit || 0).toLocaleString()}
                </span>
              </div>

              {/* RENTAL SLIDER CONTROLLER */}
              <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20 space-y-1.5 my-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 flex items-center gap-1 text-[11px]">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    ইনভেস্টর শেয়ার %
                  </span>
                  <span className="font-extrabold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded text-xs">
                    {rentalInvestorPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={rentalInvestorPercent}
                  onChange={(e) => handleRentalSliderChange(Number(e.target.value))}
                  disabled={Boolean(distributionData?.is_locked)}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>কোম্পানি: {100 - rentalInvestorPercent}%</span>
                  <span>ইনভেস্টর: {rentalInvestorPercent}%</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline text-xs text-yellow-400/90 pt-1 border-t border-white/5">
                <span>কোম্পানি অংশ ({100 - rentalInvestorPercent}%):</span>
                <span className="font-semibold">৳ {Number(ui.rentalCompanyProfit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-purple-400 font-bold pt-1 border-t border-white/5">
                <span>ইনভেস্টর পুল ({rentalInvestorPercent}%):</span>
                <span className="text-sm">৳ {Number(ui.rentalInvestorPool || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* POOL 3: BUSINESS HOLDER / INVESTMENT HOLDER (Flexible Admin Slider) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 p-4.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">বিজনেস হোল্ডার প্রফিট পুল</h3>
                  <span className="text-[11px] text-indigo-400 font-medium">Investment Holder / Share</span>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800 font-semibold">
                Share Holding
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">লভ্যাংশ / শেয়ার প্রফিট:</span>
                <span className="font-bold text-indigo-300 text-sm">
                  ৳ {Number(ui.shareTotalProfit || 0).toLocaleString()}
                </span>
              </div>

              {/* SHARE SLIDER CONTROLLER */}
              <div className="bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20 space-y-1.5 my-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 flex items-center gap-1 text-[11px]">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    ইনভেস্টর শেয়ার %
                  </span>
                  <span className="font-extrabold text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded text-xs">
                    {shareInvestorPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={shareInvestorPercent}
                  onChange={(e) => handleShareSliderChange(Number(e.target.value))}
                  disabled={Boolean(distributionData?.is_locked)}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>কোম্পানি: {100 - shareInvestorPercent}%</span>
                  <span>ইনভেস্টর: {shareInvestorPercent}%</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline text-xs text-yellow-400/90 pt-1 border-t border-white/5">
                <span>কোম্পানি অংশ ({100 - shareInvestorPercent}%):</span>
                <span className="font-semibold">৳ {Number(ui.shareCompanyProfit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-indigo-400 font-bold pt-1 border-t border-white/5">
                <span>ইনভেস্টর পুল ({shareInvestorPercent}%):</span>
                <span className="text-sm">৳ {Number(ui.shareInvestorPool || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* POOL 4: COMBINED GRAND TOTAL DISTRIBUTION */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 p-4.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">সর্বমোট বণ্টনযোগ্য পুল</h3>
                  <span className="text-[11px] text-emerald-400 font-medium">Combined Grand Total</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-semibold">
                Total Revenue
              </span>
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">সর্বমোট প্রফিট:</span>
                <span className="font-bold text-emerald-300 text-base">
                  ৳ {Number(ui.totalProfit || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-yellow-400 pt-1.5 border-t border-white/5">
                <span>কোম্পানি সর্বমোট প্রাপ্তি:</span>
                <span className="font-semibold">৳ {Number(ui.companyProfit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-emerald-400 font-extrabold pt-1.5 border-t border-white/5">
                <span>ইনভেস্টরদের মাঝে বণ্টন:</span>
                <span className="text-sm text-emerald-300">৳ {Number(ui.investorPoolProfit || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="flex items-center gap-3 bg-slate-900 border border-cyan-500/30 px-5 py-3 rounded-xl shadow-2xl">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-sm font-semibold text-white">হিসাব তৈরি হচ্ছে...</span>
            </div>
          </div>
        )}

        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/80 text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-3.5 py-3.5 text-left">#</th>
              <th className="px-3.5 py-3.5 text-left">ইনভেস্টর কার্ড</th>
              <th className="px-3.5 py-3.5 text-center">কার্ড আইডি</th>
              <th className="px-3.5 py-3.5 text-right">চলতি মাসের জমা</th>
              <th className="px-3.5 py-3.5 text-right">সক্রিয় মূলধন</th>
              <th className="px-3.5 py-3.5 text-right">Weighted Value</th>
              <th className="px-3.5 py-3.5 text-right">অনুপাত (%)</th>
              <th className="px-3.5 py-3.5 text-right text-cyan-300">কার্ড প্রফিট (৳)</th>
              <th className="px-3.5 py-3.5 text-right text-purple-300">রেন্টাল প্রফিট (৳)</th>
              <th className="px-3.5 py-3.5 text-right text-indigo-300">বিজনেস শেয়ার (৳)</th>
              <th className="px-3.5 py-3.5 text-right text-emerald-400 font-bold">মোট বণ্টন (৳)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {ui.rows?.map((item, index) => {
              const isCompany = Number(item.cardId) === 2;
              return (
                <tr
                  key={item.cardId}
                  className={`transition-colors duration-150 ${
                    isCompany ? "bg-amber-950/20 hover:bg-amber-950/30" : "hover:bg-white/5"
                  }`}
                >
                  <td className="px-3.5 py-3 text-slate-400 text-xs">{index + 1}</td>
                  <td className="px-3.5 py-3 font-medium text-white flex items-center gap-2">
                    {item.name}
                    {isCompany && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                        Company Card
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-center text-slate-300 font-mono">#{item.cardId}</td>
                  <td className="px-3.5 py-3 text-right text-slate-300">
                    ৳ {Number(item.deposit_this_month || 0).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right text-slate-300">
                    ৳ {Number(item.active_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono text-cyan-400">
                    {Number(item.weighted_value || 0).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right font-semibold text-slate-200">
                    <div>{Number(item.percent || 0).toFixed(4)}%</div>
                    {isCompany && ui.totalWV > 0 && (
                      <div className="text-[10px] text-amber-400 font-normal whitespace-nowrap">
                        (মূলধন: {((Number(item.weighted_value || 0) / ui.totalWV) * 100).toFixed(2)}%)
                      </div>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-right font-medium text-cyan-300">
                    ৳ {Number(item.cardProfit || 0).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right font-medium text-purple-300">
                    ৳ {Number(item.rentalProfit || 0).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right font-medium text-indigo-300">
                    ৳ {Number(item.shareProfit || 0).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-3 text-right font-bold text-emerald-400 text-base">
                    ৳ {Number(item.profit || 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {ui.rows?.length > 0 && (
            <tfoot className="bg-slate-900 border-t border-white/10 text-xs font-bold">
              <tr>
                <td colSpan={5} className="px-3.5 py-3.5 text-right text-slate-400 uppercase">
                  সর্বমোট হিসেব ({ui.total_cards || ui.rows.length} Cards):
                </td>
                <td className="px-3.5 py-3.5 text-right text-cyan-400 font-mono text-sm">
                  {Number(ui.totalWV || 0).toLocaleString()}
                </td>
                <td></td>
                <td className="px-3.5 py-3.5 text-right text-cyan-300 text-sm">
                  ৳ {Number(ui.cardTotalProfit || 0).toLocaleString()}
                </td>
                <td className="px-3.5 py-3.5 text-right text-purple-300 text-sm">
                  ৳ {Number(ui.rentalTotalProfit || 0).toLocaleString()}
                </td>
                <td className="px-3.5 py-3.5 text-right text-indigo-300 text-sm">
                  ৳ {Number(ui.shareTotalProfit || 0).toLocaleString()}
                </td>
                <td className="px-3.5 py-3.5 text-right text-emerald-400 text-base font-extrabold">
                  ৳ {Number(ui.totalProfit || 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default Monthly_Profit_Distributor;
