import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvestorWithdrawApplications } from "../../Redux/Applications/InvestorWithdrawApplicationFromSlice";

export default function useInvestorWithdrawApplications() {
  const dispatch = useDispatch();

  const {
    isInvestorWithdrawApplicationsLoading,
    investorWithdrawApplications,
    isInvestorWithdrawApplicationsError,
  } = useSelector((state) => state.investorWithdrawApplications);

  const fetch = useCallback(() => {
    dispatch(fetchInvestorWithdrawApplications());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isInvestorWithdrawApplicationsLoading,
    investorWithdrawApplications,
    isInvestorWithdrawApplicationsError,
    refetch: fetch,
  };
}
