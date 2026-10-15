import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSupplier } from "../../../Redux/Supplier/SupplierAnalyticsSlice";

export default function useSuppliers() {
  const dispatch = useDispatch();

  const {
    isLoading,
    suppliers,
    isError,
  } = useSelector((state) => state.suppliers);

  const fetch = useCallback(() => {
    dispatch(fetchSupplier());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isSuppliersLoading:isLoading,
    suppliers,
    isSuppliersError:isError,
    refetch: fetch,
  };
}
