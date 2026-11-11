import React from "react";
import useInvestmentProfit from "../../../utils/Investors/useInvestmentProfit";

const CardWithProfit = ({ card }) => {
  const { investProfit, isInvestProfitLoading, isInvestProfitError } =
    useInvestmentProfit({
      card_id: card.id,
      start: card.start_date,
      end: card.end_date,
    });

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        marginBottom: "10px",
      }}
    >
      <p><b>Card ID:</b> {card.id}</p>
      <p><b>Start Date:</b> {card.start_date}</p>
      <p><b>End Date:</b> {card.end_date}</p>

      {isInvestProfitLoading && <p>Calculating profit...</p>}
      {isInvestProfitError && <p>Failed to load profit</p>}

      {investProfit && (
        <p>
          <b>Total Profit:</b> {investProfit.total_profit}
        </p>
      )}
    </div>
  );
};

export default CardWithProfit;
