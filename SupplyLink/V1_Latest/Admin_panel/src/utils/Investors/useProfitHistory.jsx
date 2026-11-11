import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCardProfitHistory } from "../../Redux/Investors/ProfitAction/InvestmentProfitActionSlice";

export default function useProfitHistory() {
  const dispatch = useDispatch();

  const { profitHistory, isProfitHistoryLoading, isProfitHistoryError } =
    useSelector((state) => state.profitHistory);

  const fetch = useCallback(() => {
    dispatch(fetchCardProfitHistory());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    profitHistory,
    isProfitHistoryLoading,
    isProfitHistoryError,
    refetch: fetch,
  };
}
