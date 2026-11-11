import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesCards } from "../../../Redux/Sales/SalesCardSlice";

export default function useSalesCard() {
  const dispatch = useDispatch();

  const { isLoading, salesCards, isError } =
    useSelector((state) => state.salesCards);
  const fetch = useCallback(() => {
    dispatch(fetchSalesCards());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isSalesCardLoading:isLoading,
    salesCards,
    isSalesCardError:isError,
    refetch: fetch,
  };
}
