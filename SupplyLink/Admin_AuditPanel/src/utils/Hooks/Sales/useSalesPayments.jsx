import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesPayments } from "../../../Redux/Sales/SalesPaymentsSlice";

export default function useSalesPayments() {
  const dispatch = useDispatch();

  const { isLoading, salesPayments, isError } =
    useSelector((state) => state.salesPayments);
  const fetch = useCallback(() => {
    dispatch(fetchSalesPayments());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isSalesPaymentsLoading:isLoading,
    salesPayments,
    isSalesPaymentsError:isError,
    refetch: fetch,
  };
}
