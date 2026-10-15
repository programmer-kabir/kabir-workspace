import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSalesItems } from "../../../Redux/Sales/SalesItemsSlice";

export default function useSalesItems() {
  const dispatch = useDispatch();

  const { isLoading, salesItems, isError } =
    useSelector((state) => state.salesItems);
  const fetch = useCallback(() => {
    dispatch(fetchSalesItems());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isSalesItemsLoading:isLoading,
    salesItems,
    isSalesItemsError:isError,
    refetch: fetch,
  };
}
