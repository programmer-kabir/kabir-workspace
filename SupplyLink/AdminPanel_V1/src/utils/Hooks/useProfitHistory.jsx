import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestProfitHistory } from "../../Redux/Profit/ProfitHistory/investorsProfitHistorySlice";

export default function useProfitHistory() {
  const dispatch = useDispatch();

  const {
    isInvestProfitHistoryLoading,
    investorProfitHistory,
    isInvestProfitHistoryError,
  } = useSelector((state) => state.investorProfitHistory);

  const fetch = useCallback(() => {
    dispatch(fetchInvestProfitHistory());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isInvestProfitHistoryLoading,
    investorProfitHistory,
    isInvestProfitHistoryError,
  };
}
