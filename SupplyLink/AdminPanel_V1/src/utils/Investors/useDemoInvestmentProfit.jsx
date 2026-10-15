import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestProfit } from "../../Redux/Investors/InvestmentsProfit/InvestmentsProfitSlice";

export default function useDemoInvestmentProfit({ start, end }) {
  const dispatch = useDispatch();

  const { investProfit, isInvestProfitLoading, isInvestProfitError } =
    useSelector((state) => state.investProfit);

  useEffect(() => {
    // 🚫 No API call until everything is valid
    if (!start || !end) return;

    dispatch(fetchInvestProfit({start, end }));
  }, [dispatch, start, end]);

  return {
    investProfit,
    isInvestProfitLoading,
    isInvestProfitError,
  };
}
