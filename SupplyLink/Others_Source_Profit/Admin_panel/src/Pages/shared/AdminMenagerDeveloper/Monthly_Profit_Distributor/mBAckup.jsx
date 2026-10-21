import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import useCustomerInstallmentPayments from "../../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useInvestInstallment from "../../../../utils/Investors/useInvestInstallment";
import useProfitReinvestInstallments from "../../../../utils/Hooks/ProfitReinvest/useProfitReinvestInstallments";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import { MONTHS } from "../../../../../public/month";

/* ================= HELPERS ================= */

const toDate = (v) => {
  if (!v) return null;

  // যদি YYYY-MM-DD format হয়
  if (typeof v === "string" && v.includes("-")) {
    const [y, m, d] = v.split("T")[0].split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const dObj = new Date(v);
  return isNaN(dObj.getTime()) ? null : dObj;
};
const toDateOnly = (v) => {
  const d = toDate(v);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

const getMonthRangeExclusive = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const endExclusive = new Date(year, month, 1);
  return { start, endExclusive };
};

const getActiveDaysInRangeExclusive = (
  investmentDate,
  startDateObj,
  endExclusiveObj,
) => {
  const invest = toDateOnly(investmentDate);
  const start = toDateOnly(startDateObj);
  const endEx = toDateOnly(endExclusiveObj);
  if (!invest || !start || !endEx) return 0;
  if (invest >= endEx) return 0;

  if (invest < start) return Math.floor((endEx - start) / 86400000);
  return Math.floor((endEx - invest) / 86400000);
};

const COMPANY_PERCENT = 50;

const Monthly_Profit_Distributor = () => {
  const now = new Date();
  const COMPANY_CARD_ID = 2; // 🔥 company profit card

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  /* 🔥 FILTER STATES */
  const [mode, setMode] = useState("monthly");
  const [month, setMonth] = useState(prevMonthDate.getMonth() + 1);
  const [year, setYear] = useState(prevMonthDate.getFullYear());

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
      if (year < currentYear) return true; // past year → all months
      if (year === currentYear) return m.value < currentMonth; // current year → only completed months
      return false;
    });
  }, [year]);

  const { customerInstallmentPayments } = useCustomerInstallmentPayments();

  const { investInstallments } = useInvestInstallment();

  const { profitReinvestInstallments } = useProfitReinvestInstallments();

  const { investmentCards } = useInvestmentCards();

  /* ================= SAFE ARRAY NORMALIZE ================= */

  const investmentCardsArr = Array.isArray(investmentCards)
    ? investmentCards
    : investmentCards?.data || [];

  const investInstallmentsArr = Array.isArray(investInstallments)
    ? investInstallments
    : investInstallments?.data || [];

  const profitReinvestInstallmentsArr = Array.isArray(
    profitReinvestInstallments,
  )
    ? profitReinvestInstallments
    : profitReinvestInstallments?.data || [];

  const customerInstallmentPaymentsArr = Array.isArray(
    customerInstallmentPayments,
  )
    ? customerInstallmentPayments
    : customerInstallmentPayments?.data || [];

  /* ================= PROFIT RANGE ================= */

  const profitInRangeRaw = useMemo(() => {
    return (start, endExclusive) => {
      return customerInstallmentPaymentsArr
        .filter((item) => {
          const paid = toDate(item?.paid_date);
          if (!paid) return false;
          return paid >= start && paid < endExclusive;
        })
        .reduce((sum, item) => sum + Number(item?.profit_amount || 0), 0);
    };
  }, [customerInstallmentPaymentsArr]);

  /* ================= ACTIVE INSTALLMENTS ================= */

  const activeInvestInstallmentsTillEnd = useMemo(() => {
    return (endExclusive) => {
      return investInstallmentsArr.filter((item) => {
        const inv = toDate(item?.investment_date);
        if (!inv) return false;
        return inv < endExclusive || inv.getTime() === endExclusive.getTime();
      });
    };
  }, [investInstallmentsArr]);

  const activeProfitInstallmentsTillEnd = useMemo(() => {
    return (endExclusive) => {
      return profitReinvestInstallmentsArr.filter((item) => {
        const inv = toDate(item?.investment_date);
        if (!inv) return false;
        return inv < endExclusive || inv.getTime() === endExclusive.getTime();
      });
    };
  }, [profitReinvestInstallmentsArr]);

  /* 🔥 CARD ID NORMALIZER */
  const getInstCardId = (it) => {
    if (it?.investment_card_no) return it.investment_card_no;
    if (it?.profit_card_id) return it.profit_card_id;
    return null;
  };

  /* ================= MONTHLY RESULT ================= */
  const monthlyResult = useMemo(() => {
    const { start, endExclusive } = getMonthRangeExclusive(year, month);

    const totalProfitRaw = profitInRangeRaw(start, endExclusive);
    const companyRaw = (totalProfitRaw * COMPANY_PERCENT) / 100;
    const poolRaw = totalProfitRaw - companyRaw;

    /* 🔥 ONLY INSTALLMENTS MERGE (NO CARD MERGE) */
    const activeInstAll = [
      ...activeInvestInstallmentsTillEnd(endExclusive),
      ...activeProfitInstallmentsTillEnd(endExclusive),
    ];
    const isCardActiveInSelectedMonth = (card, start, endExclusive) => {
      const startDate = toDate(card?.start_date);
      const endDate = toDate(card?.end_date);

      if (!startDate) return false;

      // card starts after month ends
      if (startDate >= endExclusive) return false;

      // card ended before month starts
      if (endDate && endDate < start) return false;

      return true;
    };
    const instWithCard = activeInstAll.filter(
      (it) => getInstCardId(it) != null,
    );

    const investorCards = investmentCardsArr;
    const totalWV = investorCards.reduce((sum, card) => {
      const cardInst = instWithCard.filter(
        (it) => String(getInstCardId(it)) === String(card.id),
      );

      const wv = cardInst.reduce((s, it) => {
        const days = getActiveDaysInRangeExclusive(
          it.investment_date,
          start,
          endExclusive,
        );
        return s + Number(it.amount || 0) * days;
      }, 0);

      return sum + wv;
    }, 0);

    const computedRows = investorCards.map((card) => {
      const cardActive = isCardActiveInSelectedMonth(card, start, endExclusive);
      if (!cardActive) {
        return {
          investor_id: card.investor_id,
          name: `${card?.card_name || "Card"} (${card.investor_id})`,
          cardId: card.id,
          active_amount: 0,
          weighted_value: 0,
          percent: 0,
          profit: 0,
          deposit_this_month: 0,
        };
      }
      const cardInst = instWithCard.filter(
        (it) => String(getInstCardId(it)) === String(card.id),
      );
      /* 🔥 THIS MONTH DEPOSIT */
      const depositThisMonthRaw = cardInst
        .filter((it) => {
          const inv = toDate(it?.investment_date);
          if (!inv) return false;
          return inv >= start && inv < endExclusive;
        })
        .reduce((s, it) => s + Number(it.amount || 0), 0);

      const activeAmountRaw = cardInst.reduce(
        (s, it) => s + Number(it.amount || 0),
        0,
      );

      const wvRaw = cardInst.reduce((s, it) => {
        const days = getActiveDaysInRangeExclusive(
          it.investment_date,
          start,
          endExclusive,
        );
        return s + Number(it.amount || 0) * days;
      }, 0);

      const ratio = totalWV > 0 ? wvRaw / totalWV : 0;
      let percent = round4(ratio * 100);

      let profit = round4(poolRaw * (percent / 100));

      if (Number(card.id) === COMPANY_CARD_ID) {
        profit = round4(profit + companyRaw);

        // 🔥 company card percent = total profit ratio
        const totalProfitAll = totalProfitRaw; // company + investor pool
        percent =
          totalProfitAll > 0 ? round4((profit / totalProfitAll) * 100) : 0;
      }
      return {
        investor_id: card.investor_id,
        name: `${card?.card_name || "Card"} (${card.investor_id})`,
        cardId: card.id,
        active_amount: round4(activeAmountRaw),
        weighted_value: round4(wvRaw),
        percent,
        profit,
        deposit_this_month: round4(depositThisMonthRaw),
      };
    });

    return {
      rows: computedRows,
      totalProfit: round4(totalProfitRaw),
      companyProfit: round4(companyRaw),
      investorPoolProfit: round4(poolRaw),
      totalWV,
    };
  }, [
    year,
    month,
    profitInRangeRaw,
    activeInvestInstallmentsTillEnd,
    activeProfitInstallmentsTillEnd,
    investmentCardsArr,
  ]);

  const ui = monthlyResult;
  const monthName = (id) => {
    const name = MONTHS.find((month) => month.value === id);
    return name?.label;
  };

  const handleSaveMonthly = async () => {
    try {
      if (mode !== "monthly")
        return toast.error("Only Monthly mode can be saved.");

      const rows = ui.rows || [];
      if (!rows.length) return toast.error("No rows to save.");

      const cardMap = new Map(
        (investmentCards || []).map((c) => [String(c.id), c]),
      );

      const payloadRows = rows
        .filter((r) => r.cardId) // ✅ cardIds না
        .map((r) => {
          const card = cardMap.get(String(r.cardId));

          return {
            investor_id: r.investor_id,
            card_id: r.cardId,
            start_date: card?.start_date || null,
            maturity_date: card?.maturity_date || null,

            profit_month: month,
            profit_year: year,

            weight_value: Number(r.weighted_value || 0),
            percent: Number(r.percent || 0),
            amount: Number(r.deposit_this_month || 0), // ✅ fixed
            profit_amount: Number(r.profit || 0),

            status: "pending",
          };
        });

      if (!payloadRows.length)
        return toast.error("No valid card rows found to save.");

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

      if (!data?.success) return toast.error(data?.message || "Save failed");

      toast.success(
        `Inserted: ${data.inserted} | Updated: ${data.updated} | Skipped: ${data.skipped}`,
      );
    } catch (err) {
      toast.error("Save error");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-semibold mb-4">
        Profit Distribution — {monthName(month)} {year}
      </h2>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSaveMonthly}
          className="
      group relative inline-flex items-center gap-2
      bg-emerald-600 hover:bg-emerald-500
      active:scale-[0.97]
      transition-all duration-200
      px-5 py-2.5 rounded-lg
      font-semibold text-white
      shadow-lg shadow-emerald-900/30
      hover:shadow-emerald-500/20
    "
        >
          {/* icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 opacity-90 group-hover:scale-110 transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Save Monthly Profit
        </button>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="flex gap-4 justify-center mb-6 flex-wrap ">
        {/* MODE */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-md focus:outline-none"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly_sum">Yearly (Sum of 12 months)</option>
        </select>

        {/* MONTH SELECT */}
        {mode === "monthly" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            disabled={!availableMonths?.length}
            className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-md disabled:opacity-50 focus:outline-none"
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

        {/* YEAR SELECT */}
        <select
          value={year}
          onChange={(e) => {
            const newYear = Number(e.target.value);
            setYear(newYear);

            /* 🔥 OPTIONAL SMART RESET
         year change করলে invalid month থাকলে auto fix করবে */
            if (mode === "monthly" && availableMonths?.length) {
              const firstValid = availableMonths[0]?.value;
              if (firstValid) setMonth(firstValid);
            }
          }}
          className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-md focus:outline-none"
        >
          {years?.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* 🔥 SUMMARY BOX */}
      <div className="bg-slate-800/80 p-5 rounded-lg mb-6 text-base space-y-2">
        {/* 📅 DATE RANGE */}
        <div className="flex items-center gap-2 text-slate-300 mb-2 text-base">
          <span>
            📅 {year}-{String(month).padStart(2, "0")}-01
            {" → "}
            {month === 12
              ? `${year + 1}-01-01`
              : `${year}-${String(month + 1).padStart(2, "0")}-01`}
          </span>
          <span className="text-xs text-slate-400">(end exclusive)</span>
        </div>

        {/* 💰 TOTAL */}
        <div className="text-slate-200 ">
          Total Profit:
          <span className="text-emerald-400 font-semibold ml-1">
            ৳ {ui.totalProfit}
          </span>
        </div>

        {/* 🟡 COMPANY */}
        <div className="text-slate-200">
          Company Profit (50%):
          <span className="text-yellow-400 font-semibold ml-1">
            ৳ {ui.companyProfit}
          </span>
        </div>

        {/* 🟢 INVESTOR */}
        <div className="text-slate-200">
          Investor Pool (50%):
          <span className="text-emerald-400 font-semibold ml-1">
            ৳ {ui.investorPoolProfit}
          </span>
        </div>

        {/* OPTIONAL EXTRA LINE */}
        <div className="text-slate-300 text-xs">
          Distributed to Investors:
          <span className="text-emerald-400 font-semibold ml-1">
            ৳ {ui.investorPoolProfit}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-white/10 bg-white/5">
        <table className="min-w-full ">
          <thead className="bg-slate-800 text-slate-300 text-sm">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Investor</th>
              <th className="px-4 py-3 text-left">Card</th>
              <th className="px-4 py-3 text-right">Deposit (This Month) </th>
              <th className="px-4 py-3 text-right">
                Active Amount (Till End){" "}
              </th>
              <th className="px-4 py-3 text-right">Weighted Value</th>
              <th className="px-4 py-3 text-right">Percent (%)</th>
              <th className="px-4 py-3 text-right">Profit (৳)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {ui.rows?.map((item, index) => (
              <tr key={item.cardId} className=" hover:bg-white/5">
                <td className="px-4 py-3 ">{index + 1}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.cardId}</td>
                <td className="px-4 py-3 text-right">
                  {item?.deposit_this_month}
                </td>
                <td className="px-4 py-3 text-right">{item.active_amount}</td>
                <td className="px-4 py-3 text-right">{item.weighted_value}</td>
                <td className="px-4 py-3 text-right">
                  {item.percent.toFixed(4)}%
                </td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  ৳ {item.profit}
                </td>
              </tr>
            ))}{" "}
          </tbody>
          {ui.rows?.length > 0 && (
            <tfoot className="bg-slate-800/40 border-t border-white/10">
              <tr>
                {/* first 5 column empty */}
                <td colSpan={5}></td>

                {/* 🔥 TOTAL WV */}
                <td className="px-4 py-3 text-right font-bold text-cyan-400">
                  {Number(ui.totalWV || 0).toLocaleString()}
                </td>

                {/* percent empty */}
                <td></td>

                {/* 🔥 TOTAL PROFIT */}
                <td className="px-4 py-3 text-right font-bold text-emerald-400">
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
