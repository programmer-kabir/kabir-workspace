import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompanyExpenses } from "../../../Redux/Expenses/companyExpensesSlice";

export default function useCompanyExpenses() {
  const dispatch = useDispatch();

  const { isCompanyExpensesLoading, companyExpenses, isCompanyExpensesError } =
    useSelector((state) => state.companyExpenses);
  const fetch = useCallback(() => {
    dispatch(fetchCompanyExpenses());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isCompanyExpensesLoading,
    companyExpenses,
    isCompanyExpensesError,
    refetch: fetch,
  };
}
