import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCashReports } from "../../../Redux/Cash/CashReporSlice";
export default function useCashReports( ) {
  const dispatch = useDispatch();

  const {
    isCashReportsLoading,
    CashReports,
    isCashReportsError,
  } = useSelector((state) => state.CashReports);

  const fetchData = useCallback(() => {
    dispatch(fetchCashReports());
  }, [dispatch]);

  useEffect(() => {
    if (!CashReports || CashReports.length === 0) {
      fetchData();
    }
  }, [CashReports, fetchData]);

  return {
    isCashReportsLoading,
    CashReports,
    isCashReportsError,
    refetch: fetchData,
  };
}
