import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useInvestmentCards from "../../utils/Investors/useInvestmentCards";
import useProfitAnalytics from "../../utils/Hooks/useProfitAnalytics";
import { MONTHS } from "../../../public/month";
import Loader from "../Loader/Loader";
import useUsers from "../../utils/Hooks/useUsers";

const NextClosedCardProfit = () => {
  const { investmentCards, isInvestmentCardsLoading, isInvestmentCardsError } =
    useInvestmentCards();
const {users}  = useUsers()
  const { isProfitAnalyticsLoading, profitAnalytics, isUProfitAnalyticsError } =
    useProfitAnalytics();
  const [amountType, setAmountType] = useState("main");

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  /* Dynamic Years */
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
    const userMap = useMemo(() => {
      const map = {};
  
      users?.forEach((user) => {
        map[user.id] = user;
      });
  
      return map;
    }, [users]);
  /* Filter Cards */
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

  // if (isInvestmentCardsLoading || isProfitAnalyticsLoading)
  //   return <Loader />;
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
  if (isInvestmentCardsError || isUProfitAnalyticsError)
    return <p className="text-red-400">Error loading data</p>;

  return (
    <div className="mt-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
      <h2 className="text-xl font-semibold text-white">📅 Upcoming Maturity</h2>
<p className="text-slate-400 text-sm">
  Total Investors ({upcomingMaturity.length})
</p>
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
                {upcomingMaturity.slice(0, 10).map((card, index) => {
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
            {upcomingMaturity.length > 10 && (
  <div className="text-center mt-4">
    <Link
      to="/investors/upComingCloseCard"
      className="text-emerald-400 hover:underline font-semibold"
    >
      👉 View More
    </Link>
  </div>
)}
          </div>
        </div>
  );
};

export default NextClosedCardProfit;
