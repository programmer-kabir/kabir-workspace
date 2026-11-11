import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useInvestmentCards from "../../utils/Investors/useInvestmentCards";
import useProfitAnalytics from "../../utils/Hooks/useProfitAnalytics";
import { MONTHS } from "../../../public/month";
import useUsers from "../../utils/Hooks/useUsers";
import { Calendar, Phone, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const NextClosedCardProfit = () => {
  const { investmentCards, isInvestmentCardsError } = useInvestmentCards();
  const { users } = useUsers();
  const { profitAnalytics, isUProfitAnalyticsError } = useProfitAnalytics();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  /* Dynamic Years */
  const years = [];
  for (let y = 2025; y <= currentYear + 1; y++) {
    years.push(y);
  }

  /* Profit Map (FAST LOOKUP) */
  const profitMap = useMemo(() => {
    const map = {};
    if (Array.isArray(profitAnalytics)) {
      profitAnalytics.forEach((p) => {
        const id = p?.card_id;
        if (!map[id]) map[id] = 0;
        map[id] += Number(p?.profit_amount || 0);
      });
    }
    return map;
  }, [profitAnalytics]);

  const userMap = useMemo(() => {
    const map = {};
    if (Array.isArray(users)) {
      users.forEach((user) => {
        if (user?.id) map[user.id] = user;
      });
    }
    return map;
  }, [users]);

  /* Filter Cards */
  const upcomingMaturity = useMemo(() => {
    if (!Array.isArray(investmentCards)) return [];

    return investmentCards.filter((card) => {
      if (!card?.maturity_date) return false;
      const maturity = new Date(card.maturity_date);

      return (
        maturity.getMonth() === selectedMonth &&
        maturity.getFullYear() === selectedYear &&
        card?.status?.toLowerCase() !== "closed" &&
        !card?.end_date
      );
    });
  }, [investmentCards, selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    let main = 0;
    let profit = 0;

    upcomingMaturity.forEach((card) => {
      const m = Number(card.investment_amount || 0);
      const p = profitMap[card.id] || 0;
      main += m;
      profit += p;
    });

    return {
      main,
      profit,
      grand: main + profit,
    };
  }, [upcomingMaturity, profitMap]);

  if (isInvestmentCardsError || isUProfitAnalyticsError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
        আসন্ন মেয়াদের কার্ডের ডাটা লোড হতে সমস্যা হয়েছে।
      </div>
    );
  }

  return (
    <div className="w-full my-6 rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-5 backdrop-blur-xl shadow-lg">
      {/* Header Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              আসন্ন মেয়াদের কার্ড (Upcoming Maturity Cards)
            </h2>
            <p className="text-xs text-slate-400">
              নির্বাচিত মাসে চুক্তি মেয়াদ পূর্ণ হওয়া বিনিয়োগ কার্ডের তালিকা ({upcomingMaturity.length} টি)
            </p>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-[#060a14] px-3 py-1.5 text-xs font-medium text-white outline-none focus:border-indigo-500"
          >
            {MONTHS.map((m, idx) => (
              <option key={m.value || idx} value={idx}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-[#060a14] px-3 py-1.5 text-xs font-medium text-white outline-none focus:border-indigo-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-[#060a14]/60 p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">মোট মূলধন</span>
          <div className="mt-1 font-mono text-base font-bold text-sky-400">
            ৳ {totals.main.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-[#060a14]/60 p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">মোট অর্জিত মুনাফা</span>
          <div className="mt-1 font-mono text-base font-bold text-emerald-400">
            ৳ {totals.profit.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">সর্বমোট প্রদেয় (Grand Total)</span>
          <div className="mt-1 font-mono text-base font-extrabold text-indigo-300">
            ৳ {totals.grand.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#060a14]/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/[0.08] bg-slate-900/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">কার্ডের নাম</th>
                <th className="px-4 py-3">কার্ড আইডি</th>
                <th className="px-4 py-3">মোবাইল</th>
                <th className="px-4 py-3 text-right">মূল বিনিয়োগ</th>
                <th className="px-4 py-3 text-right">অর্জিত মুনাফা</th>
                <th className="px-4 py-3 text-right">সর্বমোট</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {upcomingMaturity.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <CheckCircle2 className="h-8 w-8 text-indigo-400 mb-2 opacity-75" />
                      <p className="text-sm font-medium text-slate-300">এই মাসে কোনো কার্ডের মেয়াদ শেষ হওয়ার নেই</p>
                      <p className="text-xs text-slate-500">অন্য মাস বা বছর নির্বাচন করে দেখতে পারেন</p>
                    </div>
                  </td>
                </tr>
              ) : (
                upcomingMaturity.slice(0, 10).map((card, index) => {
                  const main = Number(card.investment_amount || 0);
                  const profit = profitMap[card.id] || 0;
                  const mobile = userMap[card.investor_id]?.mobile;

                  return (
                    <tr key={card.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {card.card_name || `Card #${card.id}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                        #{card.id}
                      </td>
                      <td className="px-4 py-3">
                        {mobile ? (
                          <a
                            href={`tel:${mobile}`}
                            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{mobile}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-300">
                        ৳ {main.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">
                        ৳ {profit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold text-indigo-300">
                        ৳ {(main + profit).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {upcomingMaturity.length > 10 && (
        <div className="mt-4 flex justify-end">
          <Link
            to="/investors/upComingCloseCard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-white/10 hover:text-white transition"
          >
            <span>সকল আসন্ন কার্ড দেখুন ({upcomingMaturity.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NextClosedCardProfit;
