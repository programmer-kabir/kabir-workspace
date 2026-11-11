import React, { useMemo } from "react";
import { getPreviousMonthRange } from "./month";
import useCustomerInstallmentPayments from "../../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useInvestInstallment from "../../../../utils/Investors/useInvestInstallment";
import useUsers from "../../../../utils/Hooks/useUsers";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";

const All_profit_Distributor = () => {

  const startDate = "2025-01-01";
  const endDate = "2025-12-31";
  const {
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsError,
    isCustomerInstallmentsPaymentsLoading,
  } = useCustomerInstallmentPayments();
  const {
    investInstallments,
    inInvestInstallmentsLoading,
    isInvestInstallmentsError,
  } = useInvestInstallment();
  const { isUsersLoading, users, isUsersError } = useUsers();
  const { investmentCards, isInvestmentCardsLoading, isInvestmentCardsError } =
    useInvestmentCards();
  const isLoading =
    isCustomerInstallmentsPaymentsLoading ||
    inInvestInstallmentsLoading ||
    isInvestmentCardsLoading ||
    isUsersLoading;
  const isError =
    isCustomerInstallmentsPaymentsError ||
    isInvestInstallmentsError ||
    isInvestmentCardsError ||
    isUsersError;
  // PreviousMonth Profit
  const previousMonthProfitSum = React.useMemo(() => {
    if (!customerInstallmentPayments?.length) return 0;

    return customerInstallmentPayments
      .filter((item) => {
        const paymentDate = item.paid_date; // ⚠️ যদি createdAt হয় → item.createdAt
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      .reduce((sum, item) => sum + Number(item.profit_amount || 0), 0);
  }, [customerInstallmentPayments, startDate, endDate]);
  const lastMonthProfit = previousMonthProfitSum.toFixed(2);

  const previousMonthInstallments = useMemo(() => {
    if (!investInstallments?.length) return [];
    return investInstallments.filter((item) => {
      return (
        item.investment_date &&
        item.investment_date >= startDate &&
        item.investment_date <= endDate
      );
    });
  }, [investInstallments, startDate, endDate]);

  const previousMonthTimeWeightedSum = useMemo(() => {
    if (!previousMonthInstallments.length) return 0;

    return previousMonthInstallments.reduce(
      (sum, item) => sum + Number(item.time_wighted_value || 0),
      0
    );
  }, [previousMonthInstallments]);

  const investors = users.filter(
    (user) => Array.isArray(user.roles) && user.roles.includes("investor")
  );

  const perInvestorWeightedValueAndPercent = useMemo(() => {
    if (!investors?.length || !previousMonthInstallments.length) return [];

    return investors.map((investor) => {
      const investorInstallments = previousMonthInstallments.filter(
        (item) => String(item.investor_id) === String(investor.id)
      );

      const investedAmount = investorInstallments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      const weightedValue = investorInstallments.reduce(
        (sum, item) => sum + Number(item.time_wighted_value || 0),
        0
      );

      const percent =
        weightedValue > 0
          ? (weightedValue / previousMonthTimeWeightedSum) * 100
          : 0;
      const totalProfit = Number(lastMonthProfit) / 2;
      const profit = (totalProfit * percent) / 100;
      const cardId = investmentCards.find(
        (ivc) => ivc.investor_id === investor.id
      );
      return {
        investor_id: investor.id,
        cardId: cardId.id,
        name: investor.name,
        amount: investedAmount,
        weighted_value: weightedValue,
        percent: percent.toFixed(2),
        profit: profit.toFixed(2),
      };
    });
  }, [
    investors,
    previousMonthInstallments,
    previousMonthTimeWeightedSum,
    lastMonthProfit,
    investmentCards,
  ]);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Monthly Profit Distribution
      </h2>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full bg-slate-900 text-white">
          <thead className="bg-slate-800 text-sm text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Investor</th>
              <th className="px-4 py-3 text-left">Card ID</th>
              <th className="px-4 py-3 text-right">Invested Amount</th>
              <th className="px-4 py-3 text-right">Weighted Value</th>
              <th className="px-4 py-3 text-right">Percent (%)</th>
              <th className="px-4 py-3 text-right">Profit (৳)</th>
            </tr>
          </thead>

          <tbody>
            {perInvestorWeightedValueAndPercent.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-slate-400">
                  No data available
                </td>
              </tr>
            )}

            {perInvestorWeightedValueAndPercent?.map((item, index) => (
              <tr
                key={item.investor_id}
                className="border-t border-white/5 hover:bg-slate-800/60 transition"
              >
                <td className="px-4 py-3">{index + 1}</td>

                <td className="px-4 py-3 font-medium">
                  {item.name} ({item?.investor_id})
                </td>

                <td className="px-4 py-3">{item.cardId ?? "—"}</td>

                <td className="px-4 py-3 text-right">
                  ৳ {Number(item.amount).toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right">{item.weighted_value}</td>

                <td className="px-4 py-3 text-right">{item.percent}%</td>

                <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                  ৳ {Number(item.profit).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default All_profit_Distributor;
