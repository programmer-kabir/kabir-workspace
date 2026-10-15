import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestProfit } from "../../Redux/Investors/InvestmentsProfit/InvestmentsProfitSlice";

export default function useInvestmentProfit({ card_id, start, end }) {
  const dispatch = useDispatch();

  const { investProfit, isInvestProfitLoading, isInvestProfitError } =
    useSelector((state) => state.investProfit);

  useEffect(() => {
    // 🚫 No API call until everything is valid
    if (!card_id || !start || !end) return;

    dispatch(fetchInvestProfit({ card_id, start, end }));
  }, [dispatch, card_id, start, end]);

  return {
    investProfit,
    isInvestProfitLoading,
    isInvestProfitError,
  };
}
