import React, { useMemo } from "react";
import useProfitHistory from "../../../../utils/Investors/useProfitHistory";
import CardWithProfit from "../../../../components/Dashboard/Profit/CardWithProfit";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";

const NoProfitAction = () => {
  const {
    investInstallmentCards,
    isInvestInstallmentsCardsLoading,
    isInvestInstallmentsCardsError,
  } = useInvestmentCards();

  const { profitHistory, isProfitHistoryLoading, isProfitHistoryError } =
    useProfitHistory({});

  const isLoading = isInvestInstallmentsCardsLoading || isProfitHistoryLoading;

  const isError = isInvestInstallmentsCardsError || isProfitHistoryError;

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const profitCardIds = useMemo(() => {
    if (!profitHistory?.length) return new Set();
    return new Set(profitHistory.map((item) => Number(item.card_id)));
  }, [profitHistory]);

  const noActionCardsWithDates = useMemo(() => {
    if (!investInstallmentCards?.length) return [];

    return investInstallmentCards
      .filter((card) => !profitCardIds.has(card.id))
      .map((card) => ({
        ...card,
        start_date: card.start_date,
        end_date: card.end_date || today,
      }));
  }, [investInstallmentCards, profitCardIds, today]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Something went wrong</div>;

  return (
    <div>
      <h3>No Profit Action Cards (Auto Profit)</h3>

      {noActionCardsWithDates.map((card) => (
        <CardWithProfit key={card.id} card={card} />
      ))}
    </div>
  );
};

export default NoProfitAction;
