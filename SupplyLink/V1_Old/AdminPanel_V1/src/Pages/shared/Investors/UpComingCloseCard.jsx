import React, { useMemo, useState } from "react";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import { Link } from "react-router-dom";
import { MONTHS } from "../../../../public/month";
import useProfitAnalytics from "../../../utils/Hooks/useProfitAnalytics";
import Loader from "../../../components/Loader/Loader";
import useUsers from "../../../utils/Hooks/useUsers";

const UpComingCloseCard = () => {
  const { investmentCards, isInvestmentCardsLoading, isInvestmentCardsError } =
    useInvestmentCards();
  const { users } = useUsers();
  const { isProfitAnalyticsLoading, profitAnalytics, isUProfitAnalyticsError } =
    useProfitAnalytics();
  const [amountType, setAmountType] = useState("main");

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState("report"); /* Dynamic Years */
  const years = [];
  for (let y = 2025; y <= currentYear; y++) {
    years.push(y);
  }

  /* Profit Map (FAST LOOKUP) */
  const profitMap = useMemo(() => {
    const map = {};

    profitAnalytics?.forEach((p) => {
      const id = p.card_id; // must match card.id

      if (!map[id]) map[id] = 0;

      map[id] += Number(p.profit_amount || 0);
    });

    return map;
  }, [profitAnalytics]);
  /* Filter Cards */
  const userMap = useMemo(() => {
    const map = {};

    users?.forEach((user) => {
      map[user.id] = user;
    });

    return map;
  }, [users]);
  const upcomingMaturity = useMemo(() => {
    if (!investmentCards) return [];

    return investmentCards.filter((card) => {
      if (!card.maturity_date) return false;

      const maturity = new Date(card.maturity_date);

      return (
        maturity.getMonth() === selectedMonth &&
        maturity.getFullYear() === selectedYear &&
        card.status?.toLowerCase() !== "closed" &&
        !card.end_date
      );
    });
  }, [investmentCards, selectedMonth, selectedYear]);

  /* Total Amount */
  const totalAmount = useMemo(() => {
    return upcomingMaturity.reduce((sum, card) => {
      const profit = profitMap[card.id] || 0; // ✅ FIXED

      let amount = Number(card.investment_amount || 0);

      if (amountType === "profit") amount = profit;
      if (amountType === "both") amount = amount + profit;

      return sum + amount;
    }, 0);
  }, [upcomingMaturity, amountType, profitMap]);
  /* Remaining Days */
  const getRemainingDays = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
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
  // if (isInvestmentCardsLoading || isProfitAnalyticsLoading)
  //   return <div className="flex h-screen items-center justify-center"><Loader /></div>;

  if (isInvestmentCardsError || isUProfitAnalyticsError)
    return <p className="text-red-400">Error loading data</p>;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      {/* FILTERS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {" "}
        {/* Month + Year */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 w-full">
          {" "}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-700 text-white px-4 py-2 rounded-md border border-slate-600"
          >
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-700 text-white px-4 py-2 rounded-md border border-slate-600"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        {/* Amount Type */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 w-full sm:w-auto">
          <select
            value={amountType}
            onChange={(e) => setAmountType(e.target.value)}
            className="bg-slate-700 text-white px-4 py-2 rounded-md border border-slate-600 w-full sm:w-auto"
          >
            <option value="main">Main Amount</option>
            <option value="profit">Profit</option>
            <option value="both">Profit + Main Amount</option>
          </select>

          <div className="flex gap-2 bg-slate-700 p-1 rounded-md w-fit">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-1 rounded ${
                viewMode === "card"
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300"
              }`}
            >
              Card
            </button>

            <button
              onClick={() => setViewMode("report")}
              className={`px-3 py-1 rounded ${
                viewMode === "report"
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300"
              }`}
            >
              Goal
            </button>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">
            📅 Upcoming Maturity
          </h2>
          <p className="text-slate-400 text-sm">
            Total Investors ({upcomingMaturity.length})
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Total Amount</p>
          <p className="text-emerald-400 font-bold text-xl">
            ৳ {totalAmount.toLocaleString()}
          </p>
        </div>{" "}
      </div>

      {viewMode === "card" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingMaturity.map((card) => {
            const days = getRemainingDays(card.maturity_date);

            let badgeColor = "bg-emerald-500/20 text-emerald-400";
            if (days <= 5) badgeColor = "bg-red-500/20 text-red-400";
            else if (days <= 10)
              badgeColor = "bg-orange-500/20 text-orange-400";

            const progress = Math.max(
              0,
              Math.min(100, ((30 - days) / 30) * 100),
            );

            let amount = Number(card.investment_amount || 0);

            const profit = profitMap[card.id] || 0;

            if (amountType === "profit") {
              amount = profit;
            }

            if (amountType === "both") {
              amount = amount + profit;
            }
            return (
              <Link
                key={card.id}
                to={`/investors/details?user_id=${card.investor_id}`}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-emerald-500 hover:shadow-lg transition"
              >
                {/* Investor Name */}
                <p className="text-white font-semibold text-sm">
                  {card.card_name}
                </p>

                {/* Maturity Date */}
                <p className="text-slate-400 text-xs mt-1">
                  Maturity: {card.maturity_date}
                </p>

                {/* Progress */}
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-3">
                  <span className={`text-xs px-2 py-1 rounded ${badgeColor}`}>
                    {days} days left
                  </span>

                  <span className="text-emerald-400 font-bold">
                    ৳ {amount.toLocaleString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {upcomingMaturity.length === 0 && (
        <p className="text-slate-400 text-sm mt-4">
          No maturity found for selected month
        </p>
      )}
      {viewMode === "report" && (
        <div className="mt-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
          {/* Summary */}
          <div className="mb-4 text-white">
            <p>Total Main: ৳ {totals.main.toLocaleString()}</p>
            <p>Total Profit: ৳ {totals.profit.toLocaleString()}</p>
            <p className="font-bold text-emerald-400">
              Grand Total: ৳ {totals.grand.toLocaleString()}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text- text-left text-white">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Card Id</th>
                  <th className="px-3 py-2">Number</th>
                  <th className="px-3 py-2">Main Amount</th>
                  <th className="px-3 py-2">Profit</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>

              <tbody>
                {upcomingMaturity.map((card, index) => {
                  const main = Number(card.investment_amount || 0);
                  const profit = profitMap[card.id] || 0;

                  return (
                    <tr key={card.id} className="border-b border-slate-700">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">
                        {card.card_name}
                        
                      </td>
                      <td className="px-3 py-2">
                        {card.id}
                        
                      </td>
                      <td className="px-3 py-2 text-green-400 font-semibold hover:underline">
                      <a href={`tel:${userMap[card.investor_id]?.mobile}`}>
    {userMap[card.investor_id]?.mobile || "-"}
  </a>
                      </td>
                      <td className="px-3 py-2">৳ {main.toLocaleString()}</td>
                      <td className="px-3 py-2">৳ {profit.toLocaleString()}</td>
                      <td className="px-3 py-2 text-emerald-400">
                        ৳ {(main + profit).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpComingCloseCard;
